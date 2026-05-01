const ADMIN_PASSWORD = "0303";
const portfolioStorageKey = "sanggeunPortfolioItems";
const shareStorageKey = "sanggeunShareItems";
const deletedDefaultPortfolioStorageKey = "sanggeunDeletedDefaultPortfolioIds";
const postsJsonPath = "posts.json?v=2026050111";
const fileDatabaseName = "sanggeunBoardFiles";
const fileStoreName = "files";
const defaultPortfolioItems = [
  {
    id: "default-project-ai",
    title: "AI 활용 프로젝트 수업",
    description:
      "- 학급 뮤직비디오 만들기\n- 나만의 동화책 만들기",
  },
  {
    id: "default-automation",
    title: "교원 업무 자동화",
    description:
      "- 회의록 및 상담일지 작성 자동화\n- AI활용 학교 맞춤형 계획서/보고서 작성\n- 평가계획&생기부 작성 자동화",
  },
  {
    id: "default-generative-ai",
    title: "생성형 AI 활용 방법 및 윤리교육",
    description:
      "- 절차적 사고를 함양하는 똑똑한 AI 명령법\n   : 프롬프트 엔지니어링\n- 생성형 AI 활용 강의 : 제미나이, 캔바, SUNO 등\n- 바이브코딩을 활용한 웹디자인, 프로그램 개발\n- 생성형 AI를 활용하는 미래 시민 태도(윤리 교육)",
  },
  {
    id: "default-highlearning",
    title: "하이러닝 활용 수업",
    description:
      "- 하이러닝을 활용한 실시간 소통 수업 사례 공유\n- 하이러닝 서논술형 평가 활용 방법 및 실제 운영",
  },
];
const defaultShareItems = [];
const fallbackJsonShareItems = [
  {
    id: "pdf-topic-splitter",
    category: "노트북LM",
    title: "「PDF 자동 분할기」",
    description:
      "30페이지 이상의 PDF를 주제와 맥락에 따라 자동으로 나누어, 노트북LM에서 더 잘 인식되는 30페이지 이하 파일로 분할해주는 프로그램입니다.",
    url: "https://drive.google.com/drive/folders/1hih7BRRIBgWwwtmWUX5-XohDXLSH2OhS?usp=drive_link",
    file: null,
    source: "json",
  },
  {
    id: "highlearning-writing-rubric",
    category: "하이러닝",
    title: "「맞춤형 초등 글쓰기 지도 루브릭 생성기」",
    description:
      "학생들의 글쓰기 과제물에 대해 체계적이고 구체적인 피드백을 제공할 수 있도록, 하이러닝 서·논술형 평가 기능에서 활용 가능한 맞춤형 루브릭을 자동으로 생성해주는 GPT입니다.",
    url: "https://chatgpt.com/g/g-69eb8a4720e4819185c277b83c97bedc-haireoning-ai-seononsulhyeong-pyeongga-majcumhyeong-codeung-geulsseugi-jido-rubeurig-saengseonggi",
    file: null,
    source: "json",
  },
  {
    id: "batch-document-pdf-converter",
    category: "노트북LM",
    title: "「문서일괄 PDF 변환기」",
    description:
      "한글(HWP/HWPX), 워드, 엑셀, 파워포인트 등 여러 문서 파일을 한 번에 PDF로 변환해주는 프로그램입니다.\n※ 변환 중에는 다른 창을 클릭하지 말고 잠시 기다려야 합니다. 일부 문서 형식은 한컴오피스 또는 LibreOffice 설치가 필요할 수 있습니다.",
    url: "https://drive.google.com/drive/folders/1OHxP7_t46k3qbHOUnBz8bA0-FijJ_od2?usp=drive_link",
    file: null,
    source: "json",
  },
];

const portfolioList = document.querySelector("#portfolioList");
const shareList = document.querySelector("#shareList");
const adminOpenButtons = Array.from(document.querySelectorAll("[data-admin-open]"));
const adminModal = document.querySelector("#adminModal");
const adminForm = document.querySelector("#adminForm");
const modalClose = document.querySelector("#modalClose");
const passwordStep = document.querySelector("#passwordStep");
const postPickerStep = document.querySelector("#postPickerStep");
const postPickerList = document.querySelector("#postPickerList");
const newPostButton = document.querySelector("#newPostButton");
const editorStep = document.querySelector("#editorStep");
const passwordInput = document.querySelector("#adminPassword");
const passwordConfirm = document.querySelector("#passwordConfirm");
const modalTitle = document.querySelector("#adminModalTitle");
const categoryInput = document.querySelector("#postCategory");
const titleInput = document.querySelector("#postTitle");
const descriptionInput = document.querySelector("#postDescription");
const urlInput = document.querySelector("#postUrl");
const fileInput = document.querySelector("#postFile");
const savePostButton = document.querySelector("#savePostButton");

let activeBoard = "portfolio";
let editingPostId = null;
let portfolioItems = defaultPortfolioItems.map((item) => ({ ...item }));
let shareItems = [];
let jsonShareItems = [];
let deletedDefaultPortfolioIds = readItems(deletedDefaultPortfolioStorageKey);
portfolioItems = normalizePortfolioItems(portfolioItems);
portfolioItems = dedupePortfolioItems(portfolioItems);
saveItems(portfolioStorageKey, portfolioItems);
saveItems(shareStorageKey, shareItems);

async function loadJsonPosts() {
  try {
    const response = await fetch(postsJsonPath, { cache: "no-store" });

    if (!response.ok) {
      jsonShareItems = fallbackJsonShareItems;
      renderShares();
      return;
    }

    const posts = await response.json();
    jsonShareItems = posts.map((post, index) => ({
      id: post.id ?? `json-post-${index}`,
      category: post.category ?? "자료",
      title: post.title ?? "제목 없음",
      description: post.description ?? "",
      url: post.link ?? post.url ?? "",
      file: null,
      source: "json",
    }));
    renderShares();
  } catch (error) {
    console.warn("posts.json을 불러오지 못했습니다.", error);
    jsonShareItems = fallbackJsonShareItems;
    renderShares();
  }
}

function mergeDefaultPortfolioItems(items, deletedIds = []) {
  const deletedIdSet = new Set(deletedIds);
  const mergedDefaultItems = defaultPortfolioItems
    .filter((item) => !deletedIdSet.has(item.id))
    .map((item) => ({ ...item }));
  const defaultIds = new Set(defaultPortfolioItems.map((item) => item.id));
  const customItems = items.filter((item) => !defaultIds.has(item.id));

  return [...mergedDefaultItems, ...customItems];
}

function mergeDefaultShareItems(items) {
  const savedById = new Map(items.map((item) => [item.id, item]));
  const mergedDefaultItems = defaultShareItems.map((item) => savedById.get(item.id) ?? item);
  const defaultIds = new Set(defaultShareItems.map((item) => item.id));
  const customItems = items.filter((item) => !defaultIds.has(item.id));

  return [...mergedDefaultItems, ...customItems];
}

function removeLinklessDefaultPdfItem(items) {
  return items.filter((item) => {
    const isPdfSplitter = item.title === "PDF 자동 분할기(30페이지)";

    return !(isPdfSplitter && !item.url);
  });
}

function normalizePortfolioItems(items) {
  return items.map((item) => {
    if (item.title === "프로젝트 학습 기반 AI 수업" || item.title === "AI 활용 프로젝트 수업") {
      return {
        ...item,
        id: "default-project-ai",
        title: "AI 활용 프로젝트 수업",
        description:
          "- 학급 뮤직비디오 만들기\n- 나만의 동화책 만들기",
      };
    }

    const compactTitle = item.title.replace(/\s+/g, "");

    if (compactTitle.includes("노트북LM과제미나이기반") || compactTitle.includes("노트북LM") && compactTitle.includes("업무자동화")) {
      return {
        ...item,
        id: "default-automation",
        title: "교원 업무 자동화",
        description:
          "- 회의록 및 상담일지 작성 자동화\n- AI활용 학교 맞춤형 계획서/보고서 작성\n- 평가계획&생기부 작성 자동화",
      };
    }

    if (item.title === "생성형 AI 활용" || item.title === "생성형 AI 활용 방법 및 윤리교육") {
      return {
        ...item,
        id: "default-generative-ai",
        title: "생성형 AI 활용 방법 및 윤리교육",
        description:
          "- 절차적 사고를 함양하는 똑똑한 AI 명령법\n   : 프롬프트 엔지니어링\n- 생성형 AI 활용 강의 : 제미나이, 캔바, SUNO 등\n- 바이브코딩을 활용한 웹디자인, 프로그램 개발\n- 생성형 AI를 활용하는 미래 시민 태도(윤리 교육)",
      };
    }

    if (item.title === "하이러닝 활용 수업") {
      return {
        ...item,
        id: "default-highlearning",
        description:
          "- 하이러닝을 활용한 실시간 소통 수업 사례 공유\n- 하이러닝 서논술형 평가 활용 방법 및 실제 운영",
      };
    }

    return item;
  });
}

function dedupePortfolioItems(items) {
  const seenKeys = new Set();

  return items.filter((item) => {
    const key = item.id === "default-project-ai" ? item.id : item.title;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function readItems(key, fallbackItems = []) {
  try {
    const savedItems = JSON.parse(localStorage.getItem(key));
    return savedItems?.length ? savedItems : fallbackItems;
  } catch {
    return fallbackItems;
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

function formatMultilineText(value = "") {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function renderToolTags(labels = []) {
  return `
    <div class="tool-tags">
      ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
    </div>
  `;
}

function renderPortfolioDescription(item, description) {
  if (item.id === "default-project-ai" || item.title === "AI 활용 프로젝트 수업" || item.title === "프로젝트 학습 기반 AI 수업") {
    return `
      <div class="portfolio-list">
        <p>- 학급 뮤직비디오 만들기</p>
        ${renderToolTags(["제미나이", "SUNO", "캔바"])}
        <p>- 나만의 동화책 만들기</p>
        ${renderToolTags(["제미나이", "캔바"])}
      </div>
    `;
  }

  if (item.id === "default-automation" || item.title === "교원 업무 자동화") {
    return `
      <p class="portfolio-list">${escapeHtml(description)}</p>
    `;
  }

  if (item.id === "default-generative-ai" || item.title === "생성형 AI 활용 방법 및 윤리교육" || item.title === "생성형 AI 활용") {
    return `
      <div class="portfolio-list">
        <p>- 절차적 사고를 함양하는 똑똑한 AI 명령법<br />&nbsp;&nbsp;&nbsp;: 프롬프트 엔지니어링</p>
        <p>- 생성형 AI 활용 강의 : 제미나이, 캔바, SUNO 등</p>
        <p>- 바이브코딩을 활용한 웹디자인, 프로그램 개발</p>
        <p>- 생성형 AI를 활용하는 미래 시민 태도(윤리 교육)</p>
      </div>
    `;
  }

  if (item.id === "default-highlearning" || item.title === "하이러닝 활용 수업") {
    return `
      <div class="portfolio-list nowrap-list">
        <p>- <span class="inline-chip">하이러닝</span>을 활용한 실시간 소통 수업 사례 공유</p>
        <p>- <span class="inline-chip">하이러닝 AI 서논술형 평가</span> 활용 방법 및 실제 운영</p>
      </div>
    `;
  }

  const listClass = item.id === "default-highlearning" ? "portfolio-list nowrap-list" : "portfolio-list";
  return `<p class="${listClass}">${escapeHtml(description)}</p>`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openAdminModal(board) {
  activeBoard = board;
  editingPostId = null;
  adminForm.reset();
  passwordStep.hidden = false;
  postPickerStep.hidden = true;
  editorStep.hidden = true;
  adminModal.hidden = false;
  document.body.classList.remove("is-admin");

  const isShareBoard = activeBoard === "share";
  modalTitle.textContent = isShareBoard ? "자료 공유 글쓰기" : "강의 포트폴리오 글쓰기";
  descriptionInput.placeholder = isShareBoard
    ? "자료 설명"
    : "강의 세부 내용을 줄바꿈으로 입력하세요.";
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
  editingPostId = null;
}

function unlockEditor() {
  if (passwordInput.value !== ADMIN_PASSWORD) {
    window.alert("비밀번호가 맞지 않습니다.");
    passwordInput.select();
    return;
  }

  passwordStep.hidden = true;
  postPickerStep.hidden = false;
  document.body.classList.add("is-admin");
  renderPostPicker();
}

function getActiveItems() {
  return activeBoard === "share" ? [...jsonShareItems, ...shareItems.filter((item) => item.source !== "json")] : portfolioItems;
}

function renderPostPicker() {
  const items = getActiveItems();

  if (items.length === 0) {
    postPickerList.innerHTML = '<p class="empty-state">수정할 기존 글이 없습니다.</p>';
    return;
  }

  postPickerList.innerHTML = items
    .map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      const label = activeBoard === "share" ? item.category : number;

      return `
        <div class="post-picker-item">
          <button class="post-picker-edit" type="button" data-edit-post="${item.id}">
            <strong>${escapeHtml(label)} ${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.description).split("\n")[0]}</span>
          </button>
          ${item.source === "json" ? '<span class="json-badge">JSON</span>' : `<button class="post-picker-delete" type="button" data-delete-post="${item.id}">삭제</button>`}
        </div>
      `;
    })
    .join("");
}

function showEditor(item = null) {
  const isShareBoard = activeBoard === "share";

  editingPostId = item?.id ?? null;
  postPickerStep.hidden = true;
  editorStep.hidden = false;
  titleInput.value = item?.title ?? "";
  descriptionInput.value = item?.description ?? "";
  categoryInput.value = item?.category ?? "";
  urlInput.value = item?.url ?? "";
  fileInput.value = "";
  savePostButton.textContent = editingPostId ? "수정 저장" : "등록하기";

  categoryInput.hidden = !isShareBoard;
  urlInput.hidden = !isShareBoard;
  fileInput.hidden = !isShareBoard;
  categoryInput.required = isShareBoard;

  titleInput.focus();
}

function renderPortfolio() {
  if (portfolioItems.length === 0) {
    portfolioList.innerHTML = '<p class="empty-state">등록된 강의 포트폴리오가 없습니다.</p>';
    return;
  }

  const reviewPanelMarkup = `
    <aside class="portfolio-review-panel" aria-label="수강생 후기가 증명하는 AI 활용 수업 강좌">
      <img src="assets/ai-class-review-banner.png" alt="많은 선생님이 선택한 AI 활용 수업 강좌 수강생 후기 이미지" />
    </aside>
  `;

  portfolioList.innerHTML = reviewPanelMarkup + portfolioItems
    .map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      const description = item.description
        .replaceAll("프로젝트 학습: ", "")
        .replaceAll("AI로 학교 맞춤형", "AI활용 학교 맞춤형")
        .replaceAll("제미나이, 노트북LM, 캔바 등 생성형 AI 활용 강의", "제미나이, 캔바 등 생성형 AI 활용 강의");
      const finalDescription =
        item.id === "default-generative-ai" || item.title === "생성형 AI 활용 방법 및 윤리교육" || item.title === "생성형 AI 활용"
          ? "- 절차적 사고를 함양하는 똑똑한 AI 명령법\n   : 프롬프트 엔지니어링\n- 생성형 AI 활용 강의 : 제미나이, 캔바, SUNO 등\n- 바이브코딩을 활용한 웹디자인, 프로그램 개발\n- 생성형 AI를 활용하는 미래 시민 태도(윤리 교육)"
          : description;
      const title =
        item.id === "default-automation"
          ? "교원 업무 자동화"
          : item.title;
      const titleTools =
        item.id === "default-automation" || item.title === "교원 업무 자동화"
          ? `<div class="tool-tags title-tool-tags" aria-label="교원 업무 자동화 활용 도구"><span>제미나이</span><span>노트북LM</span></div>`
          : "";

      return `
        <article class="portfolio-card">
          <div class="portfolio-card-title">
            <span>${number}</span>
            <h3>${formatMultilineText(title)}</h3>
            ${titleTools}
          </div>
          ${renderPortfolioDescription(item, finalDescription)}
          <button class="delete-button" type="button" data-delete-portfolio="${item.id}">삭제</button>
        </article>
      `;
    })
    .join("");
}

function renderShares() {
  const visibleShareItems = jsonShareItems;

  if (visibleShareItems.length === 0) {
    shareList.innerHTML = '<p class="empty-state">등록된 무료 공유 자료가 없습니다.</p>';
    return;
  }

  shareList.innerHTML = visibleShareItems
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

newPostButton?.addEventListener("click", () => showEditor());

postPickerList?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-post]");

  if (deleteButton) {
    deletePost(deleteButton.dataset.deletePost);
    return;
  }

  const button = event.target.closest("[data-edit-post]");

  if (!button) return;

  const item = getActiveItems().find((post) => post.id === button.dataset.editPost);

  if (item) {
    if (item.source === "json") {
      window.alert("posts.json에 있는 글은 GitHub에서 posts.json 파일을 수정해야 합니다.");
      return;
    }

    showEditor(item);
  }
});

function deletePost(id) {
  if (!id) return;

  const shouldDelete = window.confirm("이 게시글을 삭제할까요?");

  if (!shouldDelete) return;

  if (activeBoard === "portfolio") {
    if (defaultPortfolioItems.some((item) => item.id === id)) {
      deletedDefaultPortfolioIds = [...new Set([...deletedDefaultPortfolioIds, id])];
      saveItems(deletedDefaultPortfolioStorageKey, deletedDefaultPortfolioIds);
    }

    portfolioItems = portfolioItems.filter((item) => item.id !== id);
    saveItems(portfolioStorageKey, portfolioItems);
    renderPortfolio();
    renderPostPicker();
    return;
  }

  const item = shareItems.find((shareItem) => shareItem.id === id);
  shareItems = shareItems.filter((shareItem) => shareItem.id !== id);
  saveItems(shareStorageKey, shareItems);
  deleteFile(item?.file?.id);
  renderShares();
  renderPostPicker();
}

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
      const nextItem = {
        id: editingPostId ?? createId(),
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
      };

      if (editingPostId) {
        portfolioItems = portfolioItems.map((item) => (item.id === editingPostId ? nextItem : item));
      } else {
        portfolioItems.push(nextItem);
      }

      saveItems(portfolioStorageKey, portfolioItems);
      renderPortfolio();
      closeAdminModal();
      return;
    }

    const existingItem = shareItems.find((item) => item.id === editingPostId);
    const id = editingPostId ?? createId();
    const url = urlInput.value.trim();
    const newFile = await saveFile(id, fileInput.files[0]);
    const file = newFile ?? existingItem?.file ?? null;

    if (!url && !file) {
      window.alert("공유 링크 또는 첨부파일 중 하나를 등록해주세요.");
      return;
    }

    const nextItem = {
      id,
      category: categoryInput.value.trim(),
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      url,
      file,
    };

    if (editingPostId) {
      shareItems = shareItems.map((item) => (item.id === editingPostId ? nextItem : item));
    } else {
      shareItems.push(nextItem);
    }

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
loadJsonPosts();
