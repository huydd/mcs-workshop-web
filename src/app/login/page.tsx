"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";

const LoginPage = () => {
  const { accounts, login, getRoleLabel, requestedPath } = useAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [password, setPassword] = useState<string>("123456");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((item) => item.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  useEffect(() => {
    if (selectedAccount) {
      setPassword("123456");
      setError(null);
    }
  }, [selectedAccount]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccount) {
      setError("Vui lòng chọn tài khoản");
      return;
    }

    const result = login(selectedAccount.email, password);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setError(null);
  };

  return (
    <Card className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary">
          <LogIn className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Minh Cường Steel
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#212121] mt-2">
          Đăng nhập hệ thống sản xuất
        </h1>
        <p className="text-sm text-[#616161] mt-2">
          Chọn tài khoản tương ứng với vai trò của bạn để tiếp tục theo dõi quy trình BOM.
        </p>
      </div>

      {requestedPath && requestedPath !== "/login" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md px-3 py-2">
          Vui lòng đăng nhập để tiếp tục truy cập <strong>{requestedPath}</strong>.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Tài khoản mẫu"
          value={selectedAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
          required
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {getRoleLabel(account.role)}
            </option>
          ))}
        </Select>

        <Input
          label="Email"
          value={selectedAccount?.email ?? ""}
          readOnly
        />

        <Input
          type="password"
          label="Mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          helper="Mật khẩu mặc định cho các tài khoản demo là 123456"
          required
        />

        {error && (
          <div className="text-sm text-[#D32F2F] bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg">
          Đăng nhập
        </Button>
      </form>
    </Card>
  );
};

export default LoginPage;
