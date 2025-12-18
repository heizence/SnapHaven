export interface UserState {
  nickname?: string;
  profileImageKey?: string | null;
}

const STORAGE_KEY = "userState";

/**
 * localStorage에 유저 정보 저장
 */
const saveUserInfo = (user: UserState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user info to localStorage:", e);
  }
};

/**
 * localStorage에서 유저 정보 불러오기
 */
const getUserInfo = (): UserState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to get user info from localStorage:", e);
    return null;
  }
};

/**
 * localStorage에 저장된 유저 정보 수정
 * 기존 값이 없으면 새로 저장
 */
const updateUserInfo = (updated: Partial<UserState>) => {
  const current = getUserInfo() || {};
  const newUserInfo = { ...current, ...updated };
  saveUserInfo(newUserInfo);
};

/**
 * localStorage에서 유저 정보 삭제
 */
const clearUserInfo = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear user info from localStorage:", e);
  }
};

const CustomLocalStorage = {
  getUserInfo,
  saveUserInfo,
  updateUserInfo,
  clearUserInfo,
};

export default CustomLocalStorage;
