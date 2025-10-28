// login.js - VERSÃO DEBUG COMPLETA
console.log('🔥 Login carregado - Debug Completo');

// Função para debug do Firestore
async function debugFirestore() {
    console.log('🛠️ === INICIANDO DEBUG DO FIRESTORE ===');
    
    try {
        const { db, firebaseModules: fb } = window.firebaseApp;
        
        if (!db) {
            console.log('❌ Firebase não inicializado');
            return;
        }

        console.log('1. 🔍 ACESSANDO COLEÇÃO "usuarios"...');
        const usersRef = fb.collection(db, 'usuarios');
        
        console.log('2. 📊 BUSCANDO TODOS OS DOCUMENTOS...');
        const allUsers = await fb.getDocs(usersRef);
        
        console.log(`✅ TOTAL DE DOCUMENTOS: ${allUsers.size}`);
        
        if (allUsers.size === 0) {
            console.log('❌ COLEÇÃO "usuarios" ESTÁ VAZIA!');
            return;
        }

        console.log('3. 📋 LISTANDO TODOS OS USUÁRIOS:');
        allUsers.forEach((doc, index) => {
            const data = doc.data();
            console.log(`--- USUÁRIO ${index + 1} ---`);
            console.log('   ID:', doc.id);
            console.log('   Dados completos:', JSON.stringify(data, null, 2));
            
            // Mostrar campos importantes
            console.log('   Campos específicos:');
            console.log('   - usuario:', data.usuario || '(não definido)');
            console.log('   - senha:', data.senha ? '***' : '(não definida)');
            console.log('   - nivel:', data.nivel || '(não definido)');
            console.log('   - ativo:', data.ativo);
            console.log('   - email:', data.email || '(não definido)');
            console.log('   - nome:', data.nome || '(não definido)');
        });

        console.log('4. 🔎 TESTANDO BUSCA COM "usuario"...');
        const q = fb.query(usersRef, fb.where("usuario", "==", "usuario"));
        const usuarioQuery = await fb.getDocs(q);
        console.log(`Resultados para "usuario": ${usuarioQuery.size}`);

        console.log('5. 🎯 SUGESTÕES DE LOGIN:');
        const sugestoes = [];
        allUsers.forEach((doc) => {
            const data = doc.data();
            if (data.usuario) {
                sugestoes.push({
                    usuario: data.usuario,
                    senha: data.senha ? '***' : 'não definida',
                    nivel: data.nivel
                });
            }
        });
        
        console.log('Usuários disponíveis:', sugestoes);

    } catch (error) {
        console.error('❌ ERRO NO DEBUG:', error);
    }
}

// Liberar formulário
function liberarFormulario() {
    console.log('🎯 Liberando formulário...');
    document.querySelectorAll('input, button').forEach(el => {
        el.style.pointerEvents = 'auto';
        el.disabled = false;
    });
}

// Sistema de login
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
        
        console.log(`🔐 Tentando login com: "${usuario}"`);
        
        // Buscar usuário no Firestore
        const { db, firebaseModules: fb } = window.firebaseApp;
        const usersRef = fb.collection(db, 'usuarios');
        
        // Primeiro, vamos ver TODOS os usuários para debug
        console.log('🔍 Buscando todos os usuários...');
        const allUsers = await fb.getDocs(usersRef);
        console.log(`📊 Total de usuários: ${allUsers.size}`);
        
        allUsers.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Usuário ${index + 1}:`, {
                id: doc.id,
                usuario: data.usuario,
                temSenha: !!data.senha,
                nivel: data.nivel,
                ativo: data.ativo
            });
        });
        
        // Agora buscar pelo usuário específico
        console.log(`🎯 Buscando por: "${usuario}"`);
        const q = fb.query(usersRef, fb.where("usuario", "==", usuario));
        const querySnapshot = await fb.getDocs(q);
        
        console.log(`📈 Resultados encontrados: ${querySnapshot.size}`);
        
        if (querySnapshot.empty) {
            // Mostrar sugestões
            const sugestoes = [];
            allUsers.forEach((doc) => {
                const data = doc.data();
                if (data.usuario) sugestoes.push(data.usuario);
            });
            
            throw new Error(`Usuário não encontrado. Tente: ${sugestoes.join(', ') || 'cadastrar um usuário primeiro'}`);
        }
        
        // Usuário encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('✅ Usuário encontrado:', userData);
        
        // Verificar senha
        if (userData.senha === senha) {
            console.log('🎉 Login bem-sucedido!');
            
            // Salvar sessão
            localStorage.setItem('usuarioLogado', JSON.stringify({
                uid: userDoc.id,
                usuario: userData.usuario,
                nome: userData.nome || userData.usuario,
                nivel: userData.nivel || 'usuario'
            }));
            
            // Redirecionar
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } else {
            throw new Error('Senha incorreta');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro: ' + error.message);
    } finally {
        btnLogin.disabled = false;
        btnText.textContent = 'Entrar no Sistema';
        spinner.classList.add('hidden');
    }
}

// Quando carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Carregado');
    liberarFormulario();
    
    // Configurar formulário
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const usuario = document.getElementById('loginUsuario').value;
            const password = document.getElementById('loginPassword').value;
            await fazerLogin(usuario, password);
        });
    }
    
    // Executar debug automaticamente
    setTimeout(debugFirestore, 1000);
    
    // Focar no input
    setTimeout(() => {
        document.getElementById('loginUsuario')?.focus();
    }, 500);
});