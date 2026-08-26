import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("SafeAlert Emergency API")
    .setDescription(
      [
        "REST + Socket.io API for the SafeAlert emergency response system.",
        "",
        "**Demo accounts**",
        "- Super Admin: `admin@safealert.app` / `adminpassword`",
        "- Ops: `ops@safealert.app` / `opspassword`",
        "- Citizen (Sarah): `sarah.johnson@example.com` / PIN `1234`",
        "- Phone OTP for Sarah: `123456`",
        "",
        "Use **Authorize** after login and paste the JWT as a Bearer token for `/api/auth/me`.",
        "",
        "**Socket.io** (`ws://localhost:5000`, same origin as REST)",
        "- Client → server: `alert:join`, `alert:telemetry`, `alert:message:send`, `alert:quick_response`, `admin:subscribe`",
        "- Server → client: `alert:state`, `alert:telemetry:update`, `alert:messages:update`, `alert:resolved`, `admin:alert:new`, `admin:alert:resolved`, `admin:alert:telemetry`, `admin:metrics`",
      ].join("\n"),
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from POST /api/auth/login",
      },
      "access-token",
    )
    .addTag("Health", "Process liveness")
    .addTag("Auth", "Register, login, OTP, PIN, password reset")
    .addTag("Alerts", "SOS trigger, telemetry, resolve")
    .addTag("Contacts", "Address book, groups, plan limits, and referral invite")
    .addTag("Profile", "Citizen profile, photos, and delete account")
    .addTag("Subscriptions", "Free vs Premium plans")
    .addTag("Legal", "About Us, Privacy Policy, Terms & Conditions")
    .addTag("Journal", "Citizen Incident Journal (Incident, Test, Update)")
    .addTag("Catalog", "Public emergency types")
    .addTag("Dashboard", "Admin metrics, users, types, subscriptions, journals")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
    yamlDocumentUrl: "api/docs-yaml",
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "method",
      docExpansion: "list",
    },
    customSiteTitle: "SafeAlert API Docs",
  });
}
