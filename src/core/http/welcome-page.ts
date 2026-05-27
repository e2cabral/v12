export const getWelcomePage = (version: string, environment: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>V12 Framework</title>
    <style>
        :root {
            --primary: #6366f1;
            --primary-hover: #818cf8;
            --bg: #0b0f1a;
            --card: #161b2c;
            --text: #e2e8f0;
            --text-dim: #94a3b8;
            --accent: #f59e0b;
        }
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: var(--text); 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 4rem 2rem; 
            background: var(--bg);
            background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, var(--bg) 70%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .card { 
            background: var(--card); 
            padding: 3rem; 
            border-radius: 24px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
            border: 1px solid rgba(255,255,255,0.05);
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), #a855f7);
        }
        h1 { color: #fff; margin-top: 0; font-size: 2.5rem; letter-spacing: -0.025em; display: flex; align-items: center; }
        .logo-box { 
            background: linear-gradient(135deg, var(--primary), #a855f7); 
            color: white; 
            padding: 0.4rem 0.8rem; 
            border-radius: 12px; 
            margin-right: 1rem; 
            font-weight: 800;
            font-style: italic;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .badge { 
            display: inline-block; 
            background: rgba(99, 102, 241, 0.1); 
            color: var(--primary); 
            padding: 0.3rem 0.75rem; 
            border-radius: 9999px; 
            font-size: 0.8rem; 
            font-weight: 600; 
            margin-right: 0.75rem;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }
        ul { list-style: none; padding: 0; margin: 2rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        li { margin-bottom: 0; }
        a { 
            color: var(--text); 
            text-decoration: none; 
            font-weight: 500; 
            display: flex; 
            align-items: center;
            gap: 0.75rem;
            transition: all 0.2s;
            padding: 1rem;
            border-radius: 16px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
        }
        a:hover { 
            background: rgba(255,255,255,0.08);
            transform: translateY(-2px);
            color: var(--primary-hover);
            border-color: rgba(99, 102, 241, 0.3);
        }
        footer { margin-top: 3rem; font-size: 0.875rem; color: var(--text-dim); text-align: center; }
        
        .motor-container {
            display: flex;
            align-items: center;
            margin-bottom: 2rem;
            gap: 1.5rem;
        }
        .engine-svg {
            width: 64px;
            height: 64px;
            color: var(--primary);
            animation: vibrate 0.2s infinite;
        }
        @keyframes vibrate {
            0% { transform: translate(0,0) rotate(0deg); }
            25% { transform: translate(1px, 1px) rotate(0.5deg); }
            50% { transform: translate(-1px, -1px) rotate(-0.5deg); }
            75% { transform: translate(1px, -1px) rotate(0.5deg); }
            100% { transform: translate(-1px, 1px) rotate(-0.5deg); }
        }
        .engine-text {
            font-size: 0.9rem;
            color: var(--text-dim);
            font-style: italic;
            border-left: 2px solid var(--primary);
            padding-left: 1rem;
        }
        @media (max-width: 600px) {
            ul { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="motor-container">
            <svg class="engine-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <div class="engine-text">V12 Engine status: <strong>High Performance</strong></div>
        </div>

        <h1><span class="logo-box">V12</span> Welcome to V12</h1>
        <p>Your feature-driven backend is up and running. V12 is designed for simplicity, cohesion, and speed.</p>
        
        <div style="margin: 1.5rem 0;">
            <span class="badge">Version ${version}</span>
            <span class="badge">Environment: ${environment}</span>
        </div>

        <h3>Quick Links</h3>
        <ul>
            <li><a href="/docs"><span>🚀</span> API Documentation</a></li>
            <li><a href="/_v12/devtools"><span>🛠️</span> DevTools Dashboard</a></li>
            <li><a href="/health"><span>🏥</span> Health Check</a></li>
            <li><a href="/metrics"><span>📊</span> Prometheus Metrics</a></li>
        </ul>
    </div>
    <footer>
        Built with <strong>V12 Framework</strong> &bull; Simplicity by Design
    </footer>
</body>
</html>
`;
