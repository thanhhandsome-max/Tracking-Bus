// login.ts

// ----------------------
// 1️⃣ Khai báo interface
// ----------------------
export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    name: string;
    role: "user" | "admin"| "driver";
  };
  message: string;
}

// ----------------------
// 2️⃣ Hàm validate form
// ----------------------
export function validateLoginForm(form: LoginForm): string {
  if (!form.email) return 'Email là bắt buộc';
  if (!form.email.includes('@')) return 'Email không hợp lệ';
  
  if (!form.password) return 'Mật khẩu là bắt buộc';
  if (form.password.length < 6) return 'Mật khẩu phải ít nhất 6 ký tự';
  
  return '';
}

// ----------------------
// 3️⃣ Hàm gọi API đăng nhập
// ----------------------
export async function loginUser(data: LoginForm): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Đăng nhập thất bại');

  return json;
}
