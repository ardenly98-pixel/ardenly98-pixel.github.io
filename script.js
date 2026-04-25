const ADMIN_PASSWORD = "0303";
const portfolioStorageKey = "sanggeunPortfolioItems";
const shareStorageKey = "sanggeunShareItems";

const searchInput = document.querySelector("#searchInput");
const portfolioList = document.querySelector("#portfolioList");
const shareList = document.querySelector("#shareList");
const adminOpenButtons = Array.from(document.querySelectorAll("[data-admin-open]"));
const adminModal = document.querySelector("#adminModal");
const adminForm = document.querySelector("#adminForm");
const modalClose = document.querySelector("#modalClose");
const passwordStep = document.querySelector("#passwordStep");
const editorStep = document.querySelector("#editorStep");
const passwordInput = document.querySelector("#adminPassword");
const passwordConfirm = document.querySelector("#passwordConfirm");
const modalTitle = document.querySelector("#adminModalTitle");
const categoryInput = document.querySelector("#postCategory");
const titleInput = document.querySelector("#postTitle");
const descriptionInput = document.querySelector("#postDescription");
const urlInput = document.querySelector("#postUrl");
const fileInput = document.querySelector("#postFile");

let activeBoard = "portfolio";
let portfolioItems = readItems(portfolioStorageKey);
let shareItems = readItems(shareStorageKey);

function readItems(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
}

function saveItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        dataUrl: reader.result,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openAdminModal(board) {
  activeBoard = board;
  adminForm.reset();
  passwordStep.hidden = false;
  editorStep.hidden = true;
  adminModal.hidden = false;
  document.body.classList.remove("is-admin");

  const isShareBoard = activeBoard === "share";
  modalTitle.textContent = isShareBoard ? "자료 공유 글쓰기" : "강의 포트폴리오 글쓰기";
  categoryInput.hidden = !isShareBoard;
  urlInput.hidden = !isShareBoard;
  fileInput.hidden = !isShareBoard;
  categoryInput.required = isShareBoard;
  urlInput.required = false;
  fileInput.required = false;

  setTimeout(() => passwordInput.focus(), 0);
}

function closeAdminModal() {
  adminModal.hidden = true;
  document.body.classList.remove("is-admin");
}

function unlockEditor() {
  if (passwordInput.value !== ADMIN_PASSWORD) {
    window.alert("비밀번호가 맞지 않습니다.");
    passwordInput.select();
    return;
  }

  passwordStep.hidden = true;
  editorStep.hidden = false;
  document.body.classList.add("is-admin");
  titleInput.focus();
}

function renderPortfolio() {
  if (portfolioItems.length === 0) {
    portfolioList.innerHTML = '<p class="empty-state">등록된 강의 포트폴리오가 없습니다.</p>';
    return;
  }

  portfolioList.innerHTML = portfolioItems
    .map((item, index) => {
      const number = String(index + 1).padStart(2, "0");

      return `
        <article class="portfolio-card">
          <span>${number}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <button class="delete-button" type="button" data-delete-portfolio="${item.id}">삭제</button>
        </article>
      `;
    })
    .join("");
}

function renderShares() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredItems = shareItems.filter((item) => {
    const text = `${item.category} ${item.title} ${item.description}`.toLowerCase();
    return query.length === 0 || text.includes(query);
  });

  if (filteredItems.length === 0) {
    shareList.innerHTML = '<p class="empty-state">등록된 무료 공유 자료가 없습니다.</p>';
    return;
  }

  shareList.innerHTML = filteredItems
    .map((item) => {
      const linkMarkup = item.url
        ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(item.title)} 링크 보기">링크</a>`
        : "";
      const fileMarkup = item.file?.dataUrl
        ? `<a href="${item.file.dataUrl}" download="${escapeHtml(item.file.name)}" aria-label="${escapeHtml(item.title)} 첨부파일 받기">첨부</a>`
        : "";

      return `
        <article class="share-item">
          <div>
            <span class="tag">${escapeHtml(item.category)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <div class="item-actions">
            ${linkMarkup}
            ${fileMarkup}
            <button class="delete-button" type="button" data-delete-share="${item.id}">삭제</button>
          </div>
        </article>
      `;
    })
    .join("");
}

adminOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openAdminModal(button.dataset.adminOpen));
});

passwordConfirm?.addEventListener("click", unlockEditor);

passwordInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    unlockEditor();
  }
});

modalClose?.addEventListener("click", closeAdminModal);

adminModal?.addEventListener("click", (event) => {
  if (event.target === adminModal) {
    closeAdminModal();
  }
});

adminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (activeBoard === "portfolio") {
    portfolioItems.push({
      id: createId(),
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
    });

    saveItems(portfolioStorageKey, portfolioItems);
    renderPortfolio();
    closeAdminModal();
    return;
  }

  const file = await readFileAsDataUrl(fileInput.files[0]);
  const url = urlInput.value.trim();

  if (!url && !file) {
    window.alert("공유 링크 또는 첨부파일 중 하나를 등록해주세요.");
    return;
  }

  shareItems.push({
    id: createId(),
    category: categoryInput.value.trim(),
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    url,
    file,
  });

  saveItems(shareStorageKey, shareItems);
  renderShares();
  closeAdminModal();
});

portfolioList?.addEventListener("click", (event) => {
  const id = event.target.dataset.deletePortfolio;

  if (!id) return;

  portfolioItems = portfolioItems.filter((item) => item.id !== id);
  saveItems(portfolioStorageKey, portfolioItems);
  renderPortfolio();
});

shareList?.addEventListener("click", (event) => {
  const id = event.target.dataset.deleteShare;

  if (!id) return;

  shareItems = shareItems.filter((item) => item.id !== id);
  saveItems(shareStorageKey, shareItems);
  renderShares();
});

searchInput?.addEventListener("input", renderShares);

renderPortfolio();
renderShares();
