# Guia de Deploy Manual via WinSCP (Hostinger)

Este guia orienta o processo de upload dos arquivos de produção da aplicação VitrineX AI para a Hostinger utilizando o WinSCP com as credenciais FTP fornecidas.

## Pré-requisitos

1.  **Build Concluído:** A pasta `dist/` deve ter sido gerada com sucesso (`npm run build`).
2.  **WinSCP Instalado:** [Download WinSCP](https://winscp.net/eng/download.php).
3.  **Credenciais de Acesso (FTP):**
    *   **Host:** `red-owl-902155.hostingersite.com` (ou IP `82.112.247.163`)
    *   **Usuário:** `u786088869.red-owl-902155.hostingersite.com`
    *   **Senha:** (Sua senha FTP criada no painel)
    *   **Porta:** 21 (FTP Padrão)

## Passo a Passo

### 1. Conectar via WinSCP

1.  Abra o WinSCP.
2.  Em **Sessão / Novo Site**:
    *   **Protocolo de arquivo:** **FTP** (Escolha FTP, não SFTP).
    *   **Criptografia:** Tente "TLS/SSL Explícito" se disponível, ou "Sem criptografia" se falhar.
    *   **Nome do host:** `red-owl-902155.hostingersite.com`
    *   **Número da porta:** 21.
    *   **Nome de usuário:** `u786088869.red-owl-902155.hostingersite.com`
    *   **Senha:** Digite sua senha.
3.  Clique em **Login**.

### 2. Encontrar a Pasta Correta

Como você está usando um usuário FTP específico, é provável que você já caia direto na pasta certa ou bem próximo dela.

1.  Procure pela pasta `public_html`.
2.  Se você já ver arquivos como `default.php` ou `index.php` logo ao entrar, **você já está na pasta certa!** (Verifique se o caminho remoto no topo mostra `/` ou `/public_html`).

### 3. Fazer o Upload

1.  No painel **Direito** (Servidor Remoto), certifique-se de estar na pasta onde os arquivos do site devem ficar (geralmente `public_html`).
    *   *Limpeza:* Se houver arquivos padrão da Hostinger, pode deletá-los para não confundir com o seu site.
2.  No painel **Esquerdo** (Seu Computador), navegue até a pasta do projeto:
    `c:\Users\Jeanc\OneDrive\Área de Trabalho\VitrineX-AI - APP\`
3.  **Pasta `dist` (FRONTEND):** Entre na pasta `dist`. Selecione **TUDO** que está dentro de `dist` e arraste para a raiz do servidor (`/public_html`).
4.  **Pasta `api` (BACKEND HOSTINGER):**
    *   Crie uma pasta chamada `api` dentro de `public_html` no servidor.
    *   No computador, navegue até `server/hostinger_api/`.
    *   Envie os arquivos `config.php`, `salvar_memoria.php` e `migrate_supabase_to_mysql.php` para essa nova pasta `api`.
5.  **Configuração de Banco de Dados:**
    *   Importe o arquivo `SCHEMA_MYSQL.sql` no seu **phpMyAdmin** na Hostinger.
    *   Edite o `api/config.php` no servidor com os dados do banco MySQL criados no painel Hostinger.

### 4. Verificar .htaccess

1.  Certifique-se de que o arquivo `.htaccess` foi enviado. Ele é crucial para o roteamento do React.

### 5. Testar

1.  Acesse `http://red-owl-902155.hostingersite.com`.
2.  Verifique se o site carrega.
3.  Teste a memória da IA (ela tentará salvar via `api/salvar_memoria.php`).
