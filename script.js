const languageSelect = document.getElementById('languageSelect');
const repoContainer = document.getElementById('repoContainer');
const refreshBtn = document.getElementById('refreshBtn');

// لو عندك توكن من GitHub، حطّه هنا (لو مش موجود اتركه فارغ)
const GITHUB_TOKEN = ''; // مثال: 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX'

// دالة لتغيير حالة الرسالة إلى Loading مع skeleton
function showLoading() {
    repoContainer.className = 'skeleton';
    repoContainer.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-short"></div>
    `;
    refreshBtn.style.display = 'none';
    setRefreshBtnState(''); // إعادة زر التحديث لحالته العادية
}

// دالة لعرض رسالة خطأ
function showError(message) {
    repoContainer.className = 'message error';
    repoContainer.textContent = message;
    refreshBtn.textContent = 'Click to retry';
    refreshBtn.style.display = 'block';
    setRefreshBtnState('error');
}

// دالة لعرض رسالة عادية (مثلاً عند طلب اختيار لغة)
function showMessage(message) {
    repoContainer.className = 'message';
    repoContainer.textContent = message;
    refreshBtn.style.display = 'none';
    setRefreshBtnState('');
}

// فنكشن عرض معلومات الريبو في الواجهة
function showRepo(repo) {
    repoContainer.className = 'repo';
    repoContainer.innerHTML = `
        <h3>
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
        </h3>
        <p>${repo.description || 'No description available.'}</p>
        <p>⭐ ${repo.stargazers_count} &nbsp;&nbsp;🔗 ${repo.forks_count} &nbsp;&nbsp;❗  ${repo.open_issues_count}</p>
    `;
    refreshBtn.textContent = 'Refresh';
    refreshBtn.style.display = 'block';
    setRefreshBtnState('');
}

// فنكشن  لتغيير حالة زر التحديث 
function setRefreshBtnState(state) {
    refreshBtn.classList.remove('loading', 'error');
    if (state === 'loading') {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    } else if (state === 'error') {
        refreshBtn.classList.add('error');
        refreshBtn.disabled = false;
    } else {
        refreshBtn.disabled = false;
    }
}

// فنكشن لجلب ريبوزيتوري عشوائي من 
async function fetchRandomRepo(language) {
    showLoading();
    setRefreshBtnState('loading');

    try {
        const headers = GITHUB_TOKEN
            ? { 'Authorization': `token ${GITHUB_TOKEN}` }
            : {};

        const queryLang = encodeURIComponent(language);

        const response = await fetch(
            `https://api.github.com/search/repositories?q=language:${queryLang}&sort=stars&order=desc&per_page=100`,
            {
                headers,
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!response.ok) {
            if (response.status === 403) {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes('rate limit')) {
                    throw new Error('Rate limit exceeded. Please wait a while and try again.');
                }
            }
            throw new Error(`Error fetching repositories: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            showMessage(`No repositories found for "${language}".`);
            setRefreshBtnState('');
            return;
        }

        const randomRepo = data.items[Math.floor(Math.random() * data.items.length)];
        showRepo(randomRepo);
        setRefreshBtnState('');

    } catch (error) {
        showError(error.message);
    }
}

//  عند تغيير اختيار اللغة
languageSelect.addEventListener('change', function () {
    const language = this.value;
    if (language) {
        fetchRandomRepo(language);
    } else {
        showMessage('Please select a language');
    }
});

//  عند الضغط على زر التحديث
refreshBtn.addEventListener('click', function () {
    const language = languageSelect.value;
    if (language) {
        fetchRandomRepo(language);
    }
});
