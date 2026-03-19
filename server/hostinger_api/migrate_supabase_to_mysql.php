<?php
/**
 * migrate_supabase_to_mysql.php
 * Sincroniza dados do Supabase (Cloud) para o MySQL Local (Hostinger)
 */

require_once 'config.php';

// Configuração do Supabase (REST API)
$SUB_URL = "https://SEU-ID.supabase.co/rest/v1";
$SUB_KEY = "SUA-ANON-KEY-AQUI"; // Pegue no painel do Supabase

/**
 * Função para buscar dados do Supabase via cURL
 */
function fetchFromSupabase($table) {
    global $SUB_URL, $SUB_KEY;
    
    $ch = curl_init("$SUB_URL/$table?select=*");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $SUB_KEY",
        "Authorization: Bearer $SUB_KEY"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode != 200) {
        throw new Exception("Erro ao buscar dados do Supabase ($httpCode): " . $response);
    }
    
    return json_decode($response, true);
}

// ---------------------------------------------------------
echo "🚀 Iniciando Migração para Hostinger...\n";

try {
    $conn = getDbConnection();
    
    // 1. Migrar Usuários
    echo "👥 Sincronizando Usuários...\n";
    $users = fetchFromSupabase('users');
    foreach ($users as $user) {
        $stmt = $conn->prepare("INSERT INTO app_users (supabase_uuid, email, plan) 
                               VALUES (:uid, :email, :plan)
                               ON DUPLICATE KEY UPDATE email = :email, plan = :plan");
        $stmt->execute([
            ':uid'   => $user['id'],
            ':email' => $user['email'] ?? 'demo@vitrinex.ai',
            ':plan'  => $user['plan'] ?? 'free'
        ]);
    }
    echo "✅ Usuários Sincronizados.\n";

    // 2. Migrar Memórias (Exemplo)
    // Se você tiver dados na Hostinger que quer baixar do Supabase (caso use Supabase via persistência de Edge Functions)
    /*
    echo "🧠 Sincronizando Memórias...\n";
    $memories = fetchFromSupabase('ia_memory_logs'); 
    foreach ($memories as $m) {
        // ... Logica de Insert ...
    }
    */

    echo "🏆 Migração concluída com sucesso!";

} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage();
}
?>
