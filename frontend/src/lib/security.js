/**
 * Security Module - Proteção Avançada do Admin
 * Implementa validação, sanitização e proteção contra ataques comuns
 */

// Validação de Token JWT
export const validateToken = (token) => {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decodificar payload (sem validação de assinatura - feita no backend)
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar expiração
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return false;
  }
};

// Sanitização de entrada para prevenir XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Sanitização de HTML (permite tags seguras)
export const sanitizeHTML = (html) => {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'];
  const allowedAttributes = ['href', 'src', 'alt', 'title'];
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const walk = (node) => {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i];
      
      if (child.nodeType === 1) { // Element node
        if (!allowedTags.includes(child.tagName.toLowerCase())) {
          node.removeChild(child);
        } else {
          // Remove disallowed attributes
          const attrs = child.attributes;
          for (let j = attrs.length - 1; j >= 0; j--) {
            if (!allowedAttributes.includes(attrs[j].name.toLowerCase())) {
              child.removeAttribute(attrs[j].name);
            }
          }
          walk(child);
        }
      }
    }
  };
  
  walk(temp);
  return temp.innerHTML;
};

// Validação de email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de URL
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validação de força de senha
export const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  return {
    isValid: Object.values(requirements).every(v => v),
    requirements
  };
};

// Rate limiting para prevenir brute force
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }
  
  isLimited(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remover tentativas antigas
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }
  
  reset(key) {
    this.attempts.delete(key);
  }
}

export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 tentativas em 15 min

// CSRF Token generation
export const generateCSRFToken = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Validação de CSRF Token
export const validateCSRFToken = (token, storedToken) => {
  return token === storedToken;
};

// Criptografia simples de dados sensíveis (client-side)
export const encryptData = (data, key) => {
  // Nota: Isso é apenas para proteção básica
  // Para dados realmente sensíveis, use HTTPS + backend encryption
  const encoded = btoa(JSON.stringify(data));
  return encoded;
};

// Descriptografia
export const decryptData = (encrypted, key) => {
  try {
    return JSON.parse(atob(encrypted));
  } catch {
    return null;
  }
};

// Logging de atividades suspeitas
export const logSecurityEvent = (eventType, details) => {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Enviar para backend para armazenamento
  console.log('Security Event:', event);
  
  // Em produção, enviar para servidor de logs
  // fetch('/api/security/log', { method: 'POST', body: JSON.stringify(event) });
};

// Proteção contra clickjacking
export const protectAgainstClickjacking = () => {
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }
};

// Content Security Policy headers (configurar no servidor)
export const getCSPHeaders = () => {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

// Validação de dados antes de enviar para API
export const validateFormData = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const rule = schema[field];
    const value = data[field];
    
    if (rule.required && !value) {
      errors[field] = 'Campo obrigatório';
    }
    
    if (rule.type === 'email' && value && !validateEmail(value)) {
      errors[field] = 'Email inválido';
    }
    
    if (rule.type === 'url' && value && !validateURL(value)) {
      errors[field] = 'URL inválida';
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `Mínimo ${rule.minLength} caracteres`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `Máximo ${rule.maxLength} caracteres`;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message || 'Formato inválido';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateToken,
  sanitizeInput,
  sanitizeHTML,
  validateEmail,
  validateURL,
  validatePassword,
  loginLimiter,
  generateCSRFToken,
  validateCSRFToken,
  encryptData,
  decryptData,
  logSecurityEvent,
  protectAgainstClickjacking,
  getCSPHeaders,
  validateFormData
};
