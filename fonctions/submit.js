export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Récupérer les données envoyées par le formulaire de ton site
    const formData = await request.formData();
    const token = formData.get("cf-turnstile-response");
    const ip = request.headers.get("CF-Connecting-IP");

    // 2. Préparer la validation avec ta clé secrète qu'on vient d'enregistrer
    const verificationData = new FormData();
    verificationData.append("secret", env.TURNSTILE_SECRET_KEY);
    verificationData.append("response", token);
    if (ip) {
      verificationData.append("remoteip", ip);
    }

    // 3. Envoyer la demande de vérification à Cloudflare
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body: verificationData,
      method: "POST",
    });

    const outcome = await result.json();

    // 4. Si la validation échoue (c'est un robot), on bloque l'accès
    if (!outcome.success) {
      return new Response(JSON.stringify({ success: false, error: "Échec de la validation du Captcha." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Si c'est un humain : le captcha est valide !
    // On renvoie un succès pour l'instant. On connectera ton service de courriel juste après.
    return new Response(JSON.stringify({ success: true, message: "Validation réussie !" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}