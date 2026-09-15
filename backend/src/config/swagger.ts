import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Safety Circle Emergency API")
    .setDescription(
      [
        "REST + Socket.io API for the Safety Circle emergency response system.",
        "",
        "**Demo accounts**",
        "- Super Admin (Dashboard): `admin@safealert.app` / `adminpassword` via `POST /api/auth/dashboard/login`",
        "- Citizen (Sarah): `sarah.johnson@example.com` / password `1234` via `POST /api/auth/login`",
        "- Phone OTP for Sarah: `123456`",
        "",
        "Roles: `SUPER_ADMIN` (Dashboard only) and `USER` (App only).",
        "Use **Authorize** after login and paste the JWT as a Bearer token.",
        "",
        "**Socket.io** (`ws://localhost:5002`, same origin as REST)",
        "- Client → server: `alert:join`, `alert:telemetry`, `alert:message:send`, `alert:quick_response`, `admin:subscribe` (dashboard Super Admin JWT required)",
        "- Server → client: `alert:state`, `alert:telemetry:update`, `alert:messages:update`, `alert:resolved`, `notification:new`, `presence:changed`, `admin:alert:new`, `admin:alert:resolved`, `admin:alert:telemetry`, `admin:metrics`",
      ].join("\n"),
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from POST /api/auth/login (App) or POST /api/auth/dashboard/login (Dashboard)",
      },
      "access-token",
    )
    .addTag("Health", "Process liveness")
    .addTag("Config", "Public client config such as Google Maps")
    .addTag("Auth", "Register, login, OTP, PIN, password reset")
    .addTag("Alerts", "SOS, Manual/Direct, Alerts tab inbox, live call, chat, respond, cancel")
    .addTag("Contacts", "Address book, groups, invitations, plan limits, and referral invite")
    .addTag("Profile", "Citizen profile, photos, and delete account")
    .addTag("Subscriptions", "Free vs Premium plans")
    .addTag("Legal", "About Us, Privacy Policy, Terms & Conditions")
    .addTag("Journal", "Citizen Incident Journal (Incident, Test, Update)")
    .addTag("Notifications", "Inbox: Direct Alert, Alert Received, Someone added you")
    .addTag("Catalog", "Public emergency types")
    .addTag("Dashboard", "Admin metrics, users, types, subscriptions, journals")
    .addTag("Uploads", "S3 image upload and presigned PUT URLs")
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
    customSiteTitle: "Safety Circle API Docs",
  });
}
