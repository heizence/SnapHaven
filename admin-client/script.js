const API_BASE = window.ENV.API_BASE;
const AWS_S3_BASE = window.ENV.AWS_S3_BASE;
const MAIN_SERVICE_URL = window.ENV.MAIN_SERVICE_URL;

let currentPage = 1;
let selectedIds = [];
let isSelectMode = false;
const token = localStorage.getItem("admin_token");

// 2. 인증 체크: 토큰이 없으면 로그인 페이지로 강제 이동
if (!token && !window.location.href.includes("login.html")) {
  window.location.href = "login.html";
}

/**
 * 서버로부터 미디어 아이템 로드 (40개 단위 페이징)
 */
async function fetchMedia(page = 1) {
  try {
    const res = await fetch(`${API_BASE}/admin/media-items?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      alert("세션이 만료되었거나 권한이 없습니다.");
      logout();
      return;
    }

    const data = await res.json();
    console.log("data : ", data);
    renderItems(data.items, page === 1);

    // 더 보기 버튼 제어
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = data.hasMore ? "block" : "none";
    }
  } catch (err) {
    console.error("데이터 로드 실패:", err);
    alert("데이터를 불러오는 중 오류가 발생했습니다.");
  }
}

/**
 * 그리드에 아이템 렌더링
 */
function renderItems(items, isNew) {
  const grid = document.getElementById("grid");
  if (isNew) grid.innerHTML = "";

  // 그리드 반응형 클래스 수정 (항목을 더 크게 보기 위해 컬럼 수 축소)
  grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  items.forEach((item) => {
    const div = document.createElement("div");

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const isDeleted = item.deletedAt !== null;

    // 카드 스타일: hover 애니메이션 제거, 테두리 및 배경 강화
    div.className = `relative flex flex-col rounded-xl border-2 bg-white shadow-sm ${
      isDeleted ? "border-red-300 bg-red-50/50" : "border-gray-200"
    }`;
    div.dataset.id = item.id;

    div.innerHTML = `
      <div class="relative aspect-square overflow-hidden rounded-t-lg bg-gray-200 border-b border-gray-200">
        <img src="${AWS_S3_BASE}/${item.keyImageSmall}" 
             class="w-full h-full object-cover ${isDeleted ? "opacity-70 grayscale" : ""}" 
             loading="lazy">
        
        ${
          isDeleted
            ? '<span class="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-10">영구 삭제 대상 (SOFT DELETED)</span>'
            : ""
        }
        
        <div class="check-overlay hidden absolute inset-0 bg-red-500/40 flex items-center justify-center z-20">
            
        </div>
      </div>

      <div class="p-4 flex flex-col gap-3 text-sm">
        <div class="space-y-2">
          <div class="flex flex-col">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-0.5">콘텐츠 제목</span>
            <span class="text-gray-900 font-semibold break-words">${
              item.title || "제목 없음"
            }</span>
          </div>

          <div class="grid grid-cols-1 gap-2 pt-2 border-t border-gray-100">
            <div class="flex flex-col">
              <span class="text-gray-400 text-xs font-bold mb-0.5">업로드 사용자 닉네임</span>
              <span class="text-gray-700 break-all">${item.uploaderNickname}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-400 text-xs font-bold mb-0.5">업로드 사용자 이메일</span>
              <span class="text-gray-700 break-all">${item.uploaderEmail}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div class="flex flex-col">
              <span class="text-gray-400 text-xs font-bold mb-0.5">콘텐츠 ID</span>
              <span class="text-gray-700">${item.id}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-400 text-xs font-bold mb-0.5">앨범 ID</span>
              <span class="text-gray-700">${item.albumId ? item.albumId : "단일 콘텐츠"}</span>
            </div>
          </div>

          <div class="flex flex-col pt-2 border-t border-gray-100">
            <span class="text-gray-400 text-xs font-bold mb-0.5">생성 일시</span>
            <span class="text-gray-700">${formatDate(item.createdAt)}</span>
          </div>

          ${
            isDeleted
              ? `
          <div class="flex flex-col pt-2 border-t border-red-200 bg-red-100/50 p-2 rounded">
            <span class="text-red-500 text-xs font-bold mb-0.5">삭제 일시 (Soft Delete)</span>
            <span class="text-red-700 font-medium">${formatDate(item.deletedAt)}</span>
          </div>`
              : ""
          }
        </div>
      </div>
    `;

    div.onclick = () => {
      if (isSelectMode) {
        toggleSelect(item, div);
      } else {
        if (item.albumId) {
          window.open(`${MAIN_SERVICE_URL}/album/${item.albumId}`, "_blank");
        } else {
          window.open(`${MAIN_SERVICE_URL}/content/${item.id}`, "_blank");
        }
      }
    };
    grid.appendChild(div);
  });
}

/**
 * 아이템 선택/해제 토글
 */
let selectedItems = []; // { id: number, isAlbum: boolean }

function toggleSelect(item, element) {
  const itemId = item.albumId ? Number(item.albumId) : Number(item.id);
  const isAlbum = Boolean(item.albumId);
  const index = selectedItems.findIndex((i) => i.id === itemId);

  if (index > -1) {
    selectedItems.splice(index, 1);
    element.classList.remove("ring-4", "ring-red-500");
    element.querySelector(".check-overlay").classList.add("hidden");
  } else {
    // 앨범인지 단일 콘텐츠인지 판별하여 저장
    // 현재 관리자 페이지 데이터 구조상 albumId가 있으면 앨범으로 취급할지,
    // 혹은 서버 응답에 isAlbum 플래그를 추가로 받아오는 것이 가장 정확합니다.
    selectedItems.push({ id: itemId, isAlbum: isAlbum });
    element.classList.add("ring-4", "ring-red-500");
    element.querySelector(".check-overlay").classList.remove("hidden");
  }
  updateUI();
}

/**
 * 상단 UI 업데이트 (삭제 버튼 등)
 */
function updateUI() {
  const btn = document.getElementById("deleteBtn");
  if (btn) {
    btn.innerText = `선택 삭제 (${selectedItems.length})`;
    btn.style.display = selectedItems.length > 0 ? "block" : "none";
  }
}

/**
 * 삭제 모드 토글 버튼 이벤트
 */
const modeBtn = document.getElementById("modeBtn");
if (modeBtn) {
  modeBtn.onclick = (e) => {
    isSelectMode = !isSelectMode;
    selectedIds = [];
    e.target.innerText = isSelectMode ? "선택 취소" : "삭제 모드 활성화";
    e.target.className = isSelectMode
      ? "px-4 py-2 bg-gray-200 text-gray-700 border rounded text-sm"
      : "px-4 py-2 border rounded hover:bg-gray-50 text-sm";

    // 모든 체크 UI 초기화
    document.querySelectorAll(".check-overlay").forEach((el) => el.classList.add("hidden"));
    document
      .querySelectorAll("#grid > div")
      .forEach((el) => el.classList.remove("ring-4", "ring-red-500"));
    updateUI();
  };
}

/**
 * 벌크 영구 삭제 실행
 */
const deleteBtn = document.getElementById("deleteBtn");
if (deleteBtn) {
  deleteBtn.onclick = async () => {
    if (
      !confirm(
        `주의: 선택한 ${selectedItems.length}개의 항목 및 관련 앨범 하위 파일을 모두 영구 삭제하시겠습니까?`
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE}/admin/media-items/bulk`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // 변경된 데이터 구조 전송
        body: JSON.stringify({ items: selectedItems }),
      });

      if (res.ok) {
        alert("데이터 및 S3 파일 영구 삭제 완료");
        location.reload();
      }
    } catch (err) {
      alert("삭제 요청 실패");
    }
  };
}

/**
 * 페이징: 더 보기 버튼
 */
const loadMoreBtn = document.getElementById("loadMoreBtn");
if (loadMoreBtn) {
  loadMoreBtn.onclick = () => {
    currentPage++;
    fetchMedia(currentPage);
  };
}

/**
 * 로그아웃
 */
function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "login.html";
}

// 초기 데이터 로드
if (token) fetchMedia(1);
