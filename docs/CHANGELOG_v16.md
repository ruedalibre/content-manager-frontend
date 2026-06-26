# Changelog v16 — v2.4.0

## Seguridad de contraseñas y mejoras de UX en autenticación

### Frontend

**UX del formulario de login:**
- Botón "ojito" (Eye/EyeOff) para mostrar/ocultar contraseña en todos los inputs de contraseña — Login, ResetPassword y UpdatePassword
- Link "¿Olvidaste tu contraseña?" reubicado debajo del input para evitar disparos accidentales con la tecla Tab y aprovechar el flujo natural de tabulación

**Validación de contraseña con regex:**
- Estándar nuevo: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial (`!@#$%^&*`)
- Indicador visual de requisitos en tiempo real durante el registro y actualización de contraseña
- Aplicado en `Login.tsx` (registro), `UpdatePassword.tsx` y `ResetPassword.tsx`

**Flujo de actualización forzada:**
- Nueva ruta pública `/update-password` para usuarios con contraseña que no cumple el nuevo estándar
- Lógica de redirección post-login: si `requires_password_update = true`, redirige automáticamente a `/update-password`
- Página `/update-password` con el mismo look & feel de Login

**Fix de flujo de recovery:**
- `ResetPassword.tsx` migrado al flujo PKCE — usa `token_hash` en query params y `verifyOtp` en lugar del flujo implícito legacy con hash
- Validación regex aplicada también en el reset password

**Claves i18n nuevas (ES/EN):**
- `login.passwordRequirementsTitle`, `login.passwordReq8chars`, `login.passwordReqUppercase`, `login.passwordReqNumber`, `login.passwordReqSpecial`
- `login.updatePasswordTitle`, `login.updatePasswordSub`, `login.updatePasswordBtn`, `login.updatingPasswordBtn`, `login.passwordUpdateSuccess`
- `login.errors.passwordWeak`, `login.errors.requiresPasswordUpdate`

### Backend

**BD:**
- Nuevo campo `requires_password_update BOOLEAN DEFAULT false` en `user_profiles`
- UPDATE masivo: `requires_password_update = true` para todos los usuarios existentes excepto el admin

**Edge Function nueva:**
- `send-password-update-notice` — envía correo en español a todos los usuarios con `requires_password_update = true`
- Template `PasswordUpdateEmailES.tsx` siguiendo el estilo Lumen
- Throttling implementado (batches de 8 con delay de 1.1s) para respetar el rate limit de Resend (10/s)
- Reporta `sent`, `failed`, `total` y `errors` detallados

**Configuración Supabase:**
- SMTP de Resend configurado como proveedor de correo en Authentication → Emails (en lugar del servicio interno con rate limits)
- Template "Reset password" actualizado para usar flujo PKCE con `{{ .TokenHash }}`

### Operacional
- 22 usuarios notificados exitosamente para actualizar su contraseña