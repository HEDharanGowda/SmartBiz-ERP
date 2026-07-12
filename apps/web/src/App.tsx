import { FormEvent, useMemo, useState } from 'react';
import { authApi, type LoginResponse, type MeResponse } from './authApi';

type MessageState = {
  kind: 'idle' | 'success' | 'error';
  title: string;
  detail?: string;
};

const emptyMessage: MessageState = {
  kind: 'idle',
  title: 'Ready'
};

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [message, setMessage] = useState<MessageState>(emptyMessage);
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', mfaEnabled: false, roles: 'Employee' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [verifyEmailToken, setVerifyEmailToken] = useState('');
  const [otpForm, setOtpForm] = useState({ challengeId: '', otp: '' });
  const [passwordResetRequestEmail, setPasswordResetRequestEmail] = useState('');
  const [passwordResetForm, setPasswordResetForm] = useState({ token: '', newPassword: '' });
  const [changePasswordForm, setChangePasswordForm] = useState({ email: '', currentPassword: '', newPassword: '' });
  const [session, setSession] = useState<{ accessToken: string; refreshToken: string; sessionId: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<MeResponse['user'] | null>(null);
  const [verificationResult, setVerificationResult] = useState<unknown>(null);
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);
  const [passwordResetResult, setPasswordResetResult] = useState<unknown>(null);

  const dashboardStats = useMemo(
    () => [
      { label: 'Sessions', value: session ? 'Active' : 'None' },
      { label: 'Current User', value: currentUser ? currentUser.email : 'Anonymous' },
      { label: 'Auth Mode', value: 'MongoDB + Redis + JWT' }
    ],
    [currentUser, session]
  );

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage({ kind: 'idle', title: 'Creating user...' });
    try {
      const result = await authApi.register({
        email: registerForm.email,
        password: registerForm.password,
        mfaEnabled: registerForm.mfaEnabled,
        roles: registerForm.roles.split(',').map((value) => value.trim()).filter(Boolean)
      });
      setVerificationResult(result);
      setMessage({ kind: 'success', title: 'User created', detail: 'Verify the email token before login.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Registration failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleVerifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.verifyEmail(verifyEmailToken);
      setVerificationResult(result);
      setMessage({ kind: 'success', title: 'Email verified', detail: 'The account can now log in.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Verification failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.login(loginForm);
      setLoginResult(result);

      if (result.accessToken && result.refreshToken && result.sessionId) {
        setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, sessionId: result.sessionId });
        setMessage({ kind: 'success', title: 'Login complete', detail: 'Session stored in memory and Redis.' });
      } else if (result.mfaRequired) {
        setMessage({ kind: 'idle', title: 'MFA required', detail: 'Use the challengeId and OTP to complete sign-in.' });
      }
    } catch (error) {
      setMessage({ kind: 'error', title: 'Login failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.verifyOtp(otpForm);
      setLoginResult(result);
      if (result.accessToken && result.refreshToken && result.sessionId) {
        setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, sessionId: result.sessionId });
      }
      setMessage({ kind: 'success', title: 'OTP verified', detail: 'MFA sign-in is now complete.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'OTP failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleMe() {
    if (!session?.accessToken) return;
    try {
      const result = await authApi.me(session.accessToken);
      setCurrentUser(result.user);
      setMessage({ kind: 'success', title: 'Profile loaded', detail: 'Fetched from the auth service.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Profile failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleRefresh() {
    if (!session?.refreshToken) return;
    try {
      const result = await authApi.refresh({ refreshToken: session.refreshToken });
      setSession((current) => (current ? { ...current, accessToken: result.accessToken, sessionId: result.sessionId } : current));
      setMessage({ kind: 'success', title: 'Access token refreshed', detail: 'The new token stayed in memory only.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Refresh failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleLogout() {
    if (!session?.sessionId) return;
    try {
      await authApi.logout({ sessionId: session.sessionId });
      setSession(null);
      setCurrentUser(null);
      setMessage({ kind: 'success', title: 'Logged out', detail: 'Redis session deleted by the auth service.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Logout failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.requestPasswordReset({ email: passwordResetRequestEmail });
      setPasswordResetResult(result);
      setMessage({ kind: 'success', title: 'Password reset requested', detail: 'Use the returned token in development.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Reset request failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.resetPassword(passwordResetForm);
      setPasswordResetResult(result);
      setMessage({ kind: 'success', title: 'Password reset', detail: 'Existing sessions were invalidated.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Reset failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await authApi.changePassword(changePasswordForm);
      setPasswordResetResult(result);
      setMessage({ kind: 'success', title: 'Password changed', detail: 'All existing sessions were removed.' });
    } catch (error) {
      setMessage({ kind: 'error', title: 'Change failed', detail: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return (
    <main className="authShell">
      <section className="heroPanel">
        <div>
          <p className="eyebrow">SmartBiz ERP Auth Console</p>
          <h1>Production-style authentication backed by MongoDB, Redis, JWT, and OTP.</h1>
          <p className="lede">
            This page talks to the API Gateway, which forwards auth requests to the auth service. Nothing is stored in
            browser local storage; session data stays in memory here and in Redis on the backend.
          </p>
        </div>

        <div className="statusStack">
          {dashboardStats.map((item) => (
            <article key={item.label} className="statusTile">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={`messageBanner ${message.kind}`}>
        <strong>{message.title}</strong>
        {message.detail ? <span>{message.detail}</span> : null}
      </section>

      <section className="authGrid">
        <article className="panel">
          <h2>Register</h2>
          <form onSubmit={handleRegister} className="formGrid">
            <label>
              Email
              <input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Password
              <input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label>
              Roles comma separated
              <input type="text" value={registerForm.roles} onChange={(event) => setRegisterForm((current) => ({ ...current, roles: event.target.value }))} />
            </label>
            <label className="checkboxRow">
              <input type="checkbox" checked={registerForm.mfaEnabled} onChange={(event) => setRegisterForm((current) => ({ ...current, mfaEnabled: event.target.checked }))} />
              Enable MFA
            </label>
            <button type="submit">Create user</button>
          </form>
        </article>

        <article className="panel">
          <h2>Login</h2>
          <form onSubmit={handleLogin} className="formGrid">
            <label>
              Email
              <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <button type="submit">Sign in</button>
          </form>
        </article>

        <article className="panel">
          <h2>MFA Verify</h2>
          <form onSubmit={handleVerifyOtp} className="formGrid">
            <label>
              Challenge ID
              <input type="text" value={otpForm.challengeId} onChange={(event) => setOtpForm((current) => ({ ...current, challengeId: event.target.value }))} />
            </label>
            <label>
              OTP
              <input type="text" value={otpForm.otp} onChange={(event) => setOtpForm((current) => ({ ...current, otp: event.target.value }))} />
            </label>
            <button type="submit">Verify OTP</button>
          </form>
        </article>

        <article className="panel">
          <h2>Email Verification</h2>
          <form onSubmit={handleVerifyEmail} className="formGrid">
            <label>
              Verification token
              <input type="text" value={verifyEmailToken} onChange={(event) => setVerifyEmailToken(event.target.value)} />
            </label>
            <button type="submit">Verify email</button>
          </form>
        </article>

        <article className="panel">
          <h2>Session Actions</h2>
          <div className="buttonRow">
            <button type="button" onClick={handleMe} disabled={!session}>Load profile</button>
            <button type="button" onClick={handleRefresh} disabled={!session}>Refresh token</button>
            <button type="button" onClick={handleLogout} disabled={!session}>Logout</button>
          </div>
          <div className="resultBlock">
            <h3>Session</h3>
            <pre>{session ? pretty(session) : 'No session in memory yet.'}</pre>
          </div>
          <div className="resultBlock">
            <h3>Current user</h3>
            <pre>{currentUser ? pretty(currentUser) : 'No profile loaded yet.'}</pre>
          </div>
        </article>

        <article className="panel">
          <h2>Password Reset</h2>
          <form onSubmit={handlePasswordResetRequest} className="formGrid">
            <label>
              Email for reset
              <input type="email" value={passwordResetRequestEmail} onChange={(event) => setPasswordResetRequestEmail(event.target.value)} />
            </label>
            <button type="submit">Request reset token</button>
          </form>
          <form onSubmit={handlePasswordReset} className="formGrid nestedForm">
            <label>
              Reset token
              <input type="text" value={passwordResetForm.token} onChange={(event) => setPasswordResetForm((current) => ({ ...current, token: event.target.value }))} />
            </label>
            <label>
              New password
              <input type="password" value={passwordResetForm.newPassword} onChange={(event) => setPasswordResetForm((current) => ({ ...current, newPassword: event.target.value }))} />
            </label>
            <button type="submit">Reset password</button>
          </form>
        </article>

        <article className="panel">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword} className="formGrid">
            <label>
              Email
              <input type="email" value={changePasswordForm.email} onChange={(event) => setChangePasswordForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Current password
              <input type="password" value={changePasswordForm.currentPassword} onChange={(event) => setChangePasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
            </label>
            <label>
              New password
              <input type="password" value={changePasswordForm.newPassword} onChange={(event) => setChangePasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
            </label>
            <button type="submit">Change password</button>
          </form>
        </article>
      </section>

      <section className="payloadGrid">
        <article className="panel codePanel">
          <h2>Latest registration / verification result</h2>
          <pre>{verificationResult ? pretty(verificationResult) : 'No registration or verification payload yet.'}</pre>
        </article>

        <article className="panel codePanel">
          <h2>Latest login / OTP result</h2>
          <pre>{loginResult ? pretty(loginResult) : 'No login payload yet.'}</pre>
        </article>

        <article className="panel codePanel">
          <h2>Latest password reset / change payload</h2>
          <pre>{passwordResetResult ? pretty(passwordResetResult) : 'No password action payload yet.'}</pre>
        </article>
      </section>
    </main>
  );
}