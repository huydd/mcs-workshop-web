"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User, UserRole, USER_ROLE_LABELS } from "@/types";

interface Account extends User {
  password: string;
}

interface LoginSuccess {
  success: true;
}

interface LoginFailure {
  success: false;
  error: string;
}

export type LoginResult = LoginSuccess | LoginFailure;

interface AuthContextValue {
  user: User | null;
  accounts: User[];
  requestedPath: string | null;
  login: (identifier: string, password: string) => LoginResult;
  logout: () => void;
  setRequestedPath: (path: string | null) => void;
  getRoleLabel: (role: UserRole) => string;
}

const STORAGE_KEY = "factoryops.auth.user";
const REQUESTED_PATH_KEY = "factoryops.auth.requestedPath";

const ACCOUNTS: Account[] = [
  {
    id: "user-toan",
    name: "Nguyễn Văn Toán",
    email: "toan.kythuat@mcs.vn",
    role: UserRole.TECHNICAL_ENGINEER,
    department: "Phòng kỹ thuật",
    password: "123456",
  },
  {
    id: "user-gioi",
    name: "Phạm Văn Giỏi",
    email: "gioi.dieuphoi@mcs.vn",
    role: UserRole.PRODUCTION_PLANNER,
    department: "Điều phối sản xuất",
    password: "123456",
  },
  {
    id: "user-workshop-a",
    name: "Trần Thị Hà",
    email: "ha.xuong1@mcs.vn",
    role: UserRole.WORKSHOP_LEAD,
    department: "Xưởng 1",
    workshopCode: "W1",
    workshopName: "Xưởng kết cấu A",
    password: "123456",
  },
  {
    id: "user-workshop-b",
    name: "Đỗ Minh Tân",
    email: "tan.xuong2@mcs.vn",
    role: UserRole.WORKSHOP_LEAD,
    department: "Xưởng 2",
    workshopCode: "W2",
    workshopName: "Xưởng gia công B",
    password: "123456",
  },
  {
    id: "user-workshop-c",
    name: "Lê Thu Trang",
    email: "trang.xuong3@mcs.vn",
    role: UserRole.WORKSHOP_LEAD,
    department: "Xưởng 3",
    workshopCode: "W3",
    workshopName: "Xưởng hàn C",
    password: "123456",
  },
  {
    id: "user-workshop-d",
    name: "Vũ Quốc Huy",
    email: "huy.xuong4@mcs.vn",
    role: UserRole.WORKSHOP_LEAD,
    department: "Xưởng 4",
    workshopCode: "W4",
    workshopName: "Xưởng hoàn thiện D",
    password: "123456",
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [requestedPath, setRequestedPath] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as User;
        setUser(parsed);
      }

      const cachedPath = window.localStorage.getItem(REQUESTED_PATH_KEY);
      if (cachedPath) {
        setRequestedPath(cachedPath);
      }
    } catch (error) {
      console.error("Failed to restore session", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (requestedPath) {
      window.localStorage.setItem(REQUESTED_PATH_KEY, requestedPath);
    } else {
      window.localStorage.removeItem(REQUESTED_PATH_KEY);
    }
  }, [requestedPath]);

  const login = useCallback((identifier: string, password: string): LoginResult => {
    const normalized = identifier.trim().toLowerCase();
    const account = ACCOUNTS.find((item) => {
      return (
        item.email.toLowerCase() === normalized ||
        item.id.toLowerCase() === normalized
      );
    });

    if (!account) {
      return { success: false, error: "Không tìm thấy tài khoản" };
    }

    if (account.password !== password) {
      return { success: false, error: "Mật khẩu chưa đúng" };
    }

    const { password: _password, ...profile } = account;
    setUser(profile);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRequestedPath(null);
  }, [setRequestedPath]);

  const accounts = useMemo(() => {
    return ACCOUNTS.map(({ password, ...rest }) => rest);
  }, []);

  const getRoleLabel = (role: UserRole) => USER_ROLE_LABELS[role];

  const value = useMemo(
    () => ({
      user,
      accounts,
      requestedPath,
      login,
      logout,
      setRequestedPath,
      getRoleLabel,
    }),
    [user, accounts, requestedPath, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
