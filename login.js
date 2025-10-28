// login.js - VERSÃO DEBUG E CORREÇÃO COMPLETA
console.log('🔥 Login carregado - Versão debug');

// Estado do formulário
let formularioLiberado = false;

function liberarFormularioCompletamente() {
    if (formularioLiberado) return;
    
    console.log('🎯 Liberando formulário completamente...');
    
    // Liberar todos os elementos
    document.querySelectorAll('*').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.style.userSelect = 'auto';
        el.style.webkitUserSelect = 'auto';
    });
    
    // Configurar inputs especificamente
    const inputs = document.querySelectorAll('input, textarea, select, button');
    inputs.forEach(input => {
        input.disabled = false;
        input.readOnly = false;
        input.style.pointerEvents = 'auto';
        input.style.cursor = 'auto';
        input.style.opacity = '1';
        
        // Remover qualquer event listener bloqueador
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });
    
    formularioLiberado = true;
    console.log('✅ Formulário completamente liberado!');
}

// Quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado - iniciando liberação');
    
    // Liberação imediata
    liberarFormularioCompletamente();
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const usuario = document.getElementById('loginUsuario').value;
            const password = document.getElementById('loginPassword').value;
            
            console.log('👤 Tentando login com:', usuario);
            
            await fazerLogin(usuario, password);
        });
    }
    
    // Focar no primeiro campo
    setTimeout(() => {
        const primeiroInput = document.getElementById('loginUsuario');
        if (primeiroInput) {
            primeiroInput.focus();
            primeiroInput.select();
        }
    }, 500);
});

// Sistema de login CORRIGIDO - com debug completo
async function fazerLogin(usuario, senha) {
    const btnLogin = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    try {
        // Validar campos
        if (!usuario.trim() || !senha.trim()) {
            throw new Error('Preencha usuário e senha');
        }

        // Mostrar loading
        btnLogin.disabled = true;
        btnText.textContent = 'Autenticando...';
        spinner.classList.remove('hidden');
        
        console.log('🔍 Iniciando busca no Firestore...');
        console.log('Usuário buscado:', usuario);
        
        // Buscar TODOS os usuários para debug
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        
        console.log('📊 Buscando TODOS os usuários...');
        const allUsersQuery = fb.query(usersRef);
        const allUsersSnapshot = await fb.getDocs(allUsersQuery);
        
        console.log('Total de usuários na coleção:', allUsersSnapshot.size);
        
        // Mostrar todos os usuários encontrados
        allUsersSnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log('--- Usuário encontrado ---');
            console.log('ID:', doc.id);
            console.log('Dados:', userData);
            console.log('Campo "usuario":', userData.usuario);
            console.log('Campo "senha":', userData.senha);
            console.log('-------------------');
        });
        
        // Agora buscar pelo usuário específico
        console.log(`🔎 Buscando usuário específico: "${usuario}"`);
        const q = fb.query(usersRef, fb.where("usuario", "==", usuario));
        const querySnapshot = await fb.getDocs(q);
        
        console.log('Resultados da busca específica:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            console.log('❌ Nenhum usuário encontrado com esse nome');
            // Mostrar sugestões baseadas nos usuários existentes
            const sugestoes = [];
            allUsersSnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.usuario) {
                    sugestoes.push(userData.usuario);
                }
            });
            console.log('Sugestões de usuários existentes:', sugestoes);
            throw new Error(`Usuário "${usuario}" não encontrado. Usuários disponíveis: ${sugestoes.join(', ') || 'nenhum'}`);
        }
        
        // Pegar o primeiro usuário encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('✅ Usuário encontrado!');
        console.log('Dados completos:', userData);
        
        // Verificar se usuário está ativo
        if (userData.ativo === false) {
            throw new Error('Usuário inativo. Contate o administrador.');
        }
        
        // VERIFICAR SENHA
        console.log('🔐 Verificando senha...');
        console.log('Senha digitada:', senha);
        console.log('Senha no banco:', userData.senha);
        
        if (userData.senha && userData.senha === senha) {
            console.log('✅ Senha correta! Login bem-sucedido.');
            
            // Salvar sessão local
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: userDoc.id,
                usuario: userData.usuario,
                nome: userData.nome || userData.usuario,
                nivel: userData.nivel || 'usuario',
                email: userData.email || '',
                sessaoAtiva: userData.sessaoAtiva
            }));
            
            // Mostrar sucesso
            mostrarSucessoLogin(`Bem-vindo, ${userData.usuario}!`);
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
            return;
        } else {
            console.log('❌ Senha incorreta');
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        
        // Mostrar erro de forma visível
        mostrarErroLogin(error.message);
        
    } finally {
        // Restaurar botão
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

function mostrarErroLogin(mensagem) {
    // Criar ou atualizar notificação de erro
    let notificacao = document.getElementById('notificacaoErro');
    
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacaoErro';
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        document.body.appendChild(notificacao);
    }
    
    notificacao.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Erro no Login:</strong> ${mensagem}
    `;
    
    notificacao.style.display = 'block';
    
    // Auto-remover após 8 segundos (mais tempo para ler)
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 8000);
}

function mostrarSucessoLogin(mensagem) {
    let notificacao = document.getElementById('notificacaoSucesso');
    
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacaoSucesso';
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        document.body.appendChild(notificacao);
    }
    
    notificacao.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>Sucesso!</strong> ${mensagem}
    `;
    
    notificacao.style.display = 'block';
    
    setTimeout(() => {
        notificacao.style.display = 'none';
    }, 3000);
}

function fecharModalBloqueio() {
    document.getElementById('blockedModal').style.display = 'none';
}

// Fallback agressivo - liberar tudo
setTimeout(liberarFormularioCompletamente, 100);
setTimeout(liberarFormularioCompletamente, 500);
setTimeout(liberarFormularioCompletamente, 1000);

// Forçar foco no formulário
window.addEventListener('load', function() {
    console.log('🔄 Página completamente carregada');
    liberarFormularioCompletamente();
    
    setTimeout(() => {
        const usuarioInput = document.getElementById('loginUsuario');
        if (usuarioInput) {
            usuarioInput.focus();
            usuarioInput.select();
        }
    }, 1000);
});