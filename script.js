const ADMIN_PASSWORD = "0303";
const portfolioStorageKey = "sanggeunPortfolioItems";
const shareStorageKey = "sanggeunShareItems";
const fileDatabaseName = "sanggeunBoardFiles";
const fileStoreName = "files";

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

function openFileDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(fileDatabaseName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(fileStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFile(id, file) {
  if (!file) return null;

  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(fileStoreName, "readwrite");
    const store = transaction.objectStore(fileStoreName);

    store.put({
      id,
      name: file.name,
      type: file.type || "application/octet-stream",
      blob: file,
    });

    transaction.oncomplete = () => {
      database.close();
      resolve({
        id,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      });
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function getFile(id) {
  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(fileStoreName, "readonly");
    const store = transaction.objectStore(fileStoreName);
    const request = store.get(id);

    request.onsuccess = () => {
      database.close();
      resolve(request.result);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function deleteFile(id) {
  if (!id) return;

  const database = await openFileDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(fileStoreName, "readwrite");
    const store = transaction.objectStore(fileStoreName);

    store.delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function downloadFile(id) {
  const file = await getFile(id);

  if (!file) {
    window.alert("첨부파일을 찾을 수 없습니다. 다시 등록해주세요.");
    return;
  }

  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  if (shareItems.length === 0) {
    shareList.innerHTML = '<p class="empty-state">등록된 무료 공유 자료가 없습니다.</p>';
    return;
  }

  shareList.innerHTML = shareItems
    .map((item) => {
      const linkMarkup = item.url
        ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(item.title)} 링크 보기">링크</a>`
        : "";
      const fileMarkup = item.file?.dataUrl
        ? `<a href="${item.file.dataUrl}" download="${escapeHtml(item.file.name)}" aria-label="${escapeHtml(item.title)} 첨부파일 받기">첨부</a>`
        : item.file?.id
          ? `<button class="file-button" type="button" data-download-file="${item.file.id}" aria-label="${escapeHtml(item.title)} 첨부파일 받기">첨부</button>`
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

  try {
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

    const id = createId();
    const url = urlInput.value.trim();
    const file = await saveFile(id, fileInput.files[0]);

    if (!url && !file) {
      window.alert("공유 링크 또는 첨부파일 중 하나를 등록해주세요.");
      return;
    }

    shareItems.push({
      id,
      category: categoryInput.value.trim(),
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      url,
      file,
    });

    saveItems(shareStorageKey, shareItems);
    renderShares();
    closeAdminModal();
  } catch (error) {
    console.error(error);
    window.alert("등록 중 문제가 생겼습니다. 파일 용량을 줄이거나 링크로 등록해보세요.");
  }
});

portfolioList?.addEventListener("click", (event) => {
  const id = event.target.dataset.deletePortfolio;

  if (!id) return;

  portfolioItems = portfolioItems.filter((item) => item.id !== id);
  saveItems(portfolioStorageKey, portfolioItems);
  renderPortfolio();
});

shareList?.addEventListener("click", (event) => {
  const fileId = event.target.dataset.downloadFile;

  if (fileId) {
    downloadFile(fileId);
    return;
  }

  const id = event.target.dataset.deleteShare;

  if (!id) return;

  const item = shareItems.find((shareItem) => shareItem.id === id);
  shareItems = shareItems.filter((item) => item.id !== id);
  saveItems(shareStorageKey, shareItems);
  deleteFile(item?.file?.id);
  renderShares();
});

renderPortfolio();
renderShares();
