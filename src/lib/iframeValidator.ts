/**
 * Checks if a URL allows iframe embedding by fetching its HTTP headers.
 * Uses the free Hackertarget HTTP Headers API for cross-origin header inspection.
 */
export async function checkIframeAllowed(url: string): Promise<{ allowed: boolean; error?: string }> {
    try {
        // Basic URL validation
        new URL(url);
    } catch (e) {
        return { allowed: false, error: '無効なURLです。' };
    }

    try {
        const checkUrl = `https://api.hackertarget.com/httpheaders/?q=${encodeURIComponent(url)}`;
        const response = await fetch(checkUrl);

        if (!response.ok) {
            // If the checker API itself fails, we might want to default to allowed or ask for retry
            // But for safety, we'll let it pass or inform the user.
            return { allowed: true };
        }

        const text = await response.text();
        const lines = text.toLowerCase().split('\n');

        let isDenied = false;
        let denyReason = '';

        for (const line of lines) {
            // Check X-Frame-Options
            if (line.includes('x-frame-options:')) {
                if (line.includes('deny') || line.includes('sameorigin')) {
                    isDenied = true;
                    denyReason = 'X-Frame-Optionsにより埋め込みが禁止されています。';
                    break;
                }
            }

            // Check Content-Security-Policy for frame-ancestors
            if (line.includes('content-security-policy:')) {
                if (line.includes('frame-ancestors')) {
                    // If frame-ancestors is present, it usually blocks cross-origin unless specifically allowed.
                    // Common blocks: 'none', 'self'
                    if (line.includes("'none'") || line.includes("'self'")) {
                        isDenied = true;
                        denyReason = 'Content-Security-Policy (frame-ancestors) により埋め込みが禁止されています。';
                        break;
                    }
                    // If it has frame-ancestors but NOT 'none'/'self', it might still be restricted to specific origins.
                    // For the sake of this tool, we assume any restriction on frame-ancestors might break it.
                    isDenied = true;
                    denyReason = 'Content-Security-Policy により埋め込みが制限されています。';
                    break;
                }
            }
        }

        if (isDenied) {
            return { allowed: false, error: denyReason };
        }

        return { allowed: true };
    } catch (e) {
        console.error('Iframe validation error:', e);
        // If validation fails due to network/API issues, we'll default to allowed to avoid blocking valid sites.
        return { allowed: true };
    }
}
