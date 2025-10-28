// login.js SIMPLIFICADO
console.log('🔥 Login carregado - versão simplificada');

// Remover qualquer bloqueio existente
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - formulário liberado');
    
    // Liberar todos os inputs e botões
    const inputs = document.querySelectorAll('input, button, textarea, select');
    inputs.forEach(element => {
        element.style.pointerEvents = 'auto';
        element.disabled = false;
    });
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('📧 Email:', email);
            console.log('🔐 Password:', password ? '***' : 'vazio');
            
            // Simular login bem-sucedido
            alert('Login realizado com: ' + email);
            window.location.href = 'index.html';
        });
    }
    
    // Focar no primeiro campo
    document.getElementById('loginEmail')?.focus();
});

// Forçar liberação após 1 segundo (fallback)
setTimeout(() => {
    console.log('⏰ Fallback - liberando elementos');
    document.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'auto';
    });
}, 1000);