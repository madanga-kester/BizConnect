using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations;

public partial class Stage8BusinessGrowth : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS public.business_reviews (\"Id\" uuid NOT NULL, \"BusinessId\" uuid NOT NULL, \"ReviewerUserId\" uuid NOT NULL, \"Rating\" integer NOT NULL, \"Comment\" character varying(2000) NOT NULL, \"Status\" character varying(16) NOT NULL, \"OwnerResponse\" character varying(2000), \"OwnerRespondedAtUtc\" timestamp with time zone, \"OwnerRespondedByUserId\" uuid, \"CreatedAtUtc\" timestamp with time zone NOT NULL, \"UpdatedAtUtc\" timestamp with time zone NOT NULL, CONSTRAINT \"PK_business_reviews\" PRIMARY KEY (\"Id\"), CONSTRAINT \"CK_business_reviews_rating\" CHECK (\"Rating\" BETWEEN 1 AND 5), CONSTRAINT \"CK_business_reviews_status\" CHECK (\"Status\" IN ('published','hidden','reported')));");
        migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"UX_business_reviews_one_per_user\" ON public.business_reviews (\"BusinessId\", \"ReviewerUserId\");");
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS public.business_milestones (\"Id\" uuid NOT NULL, \"BusinessId\" uuid NOT NULL, \"CreatedByUserId\" uuid NOT NULL, \"Title\" character varying(160) NOT NULL, \"Description\" character varying(2000), \"AchievedAtUtc\" timestamp with time zone NOT NULL, \"IsSelfReported\" boolean NOT NULL, \"Visibility\" character varying(16) NOT NULL, \"CreatedAtUtc\" timestamp with time zone NOT NULL, \"UpdatedAtUtc\" timestamp with time zone NOT NULL, CONSTRAINT \"PK_business_milestones\" PRIMARY KEY (\"Id\"), CONSTRAINT \"CK_business_milestones_visibility\" CHECK (\"Visibility\" IN ('public','private')));");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_business_milestones_business_visibility_achieved\" ON public.business_milestones (\"BusinessId\", \"Visibility\", \"AchievedAtUtc\");");
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS public.business_opportunities (\"Id\" uuid NOT NULL, \"BusinessId\" uuid NOT NULL, \"CreatedByUserId\" uuid NOT NULL, \"Title\" character varying(180) NOT NULL, \"Description\" character varying(4000) NOT NULL, \"Category\" character varying(80) NOT NULL, \"Budget\" numeric(18,2), \"Currency\" character varying(3) NOT NULL, \"ExpiresAtUtc\" timestamp with time zone NOT NULL, \"Status\" character varying(16) NOT NULL, \"CreatedAtUtc\" timestamp with time zone NOT NULL, \"UpdatedAtUtc\" timestamp with time zone NOT NULL, CONSTRAINT \"PK_business_opportunities\" PRIMARY KEY (\"Id\"), CONSTRAINT \"CK_business_opportunities_status\" CHECK (\"Status\" IN ('open','closed')));");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_business_opportunities_status_expires_category\" ON public.business_opportunities (\"Status\", \"ExpiresAtUtc\", \"Category\");");
        migrationBuilder.Sql("CREATE TABLE IF NOT EXISTS public.business_analytics_events (\"Id\" uuid NOT NULL, \"BusinessId\" uuid NOT NULL, \"ActorUserId\" uuid, \"EventType\" character varying(80) NOT NULL, \"SubjectType\" character varying(40), \"SubjectId\" uuid, \"MetadataJson\" jsonb, \"CreatedAtUtc\" timestamp with time zone NOT NULL, CONSTRAINT \"PK_business_analytics_events\" PRIMARY KEY (\"Id\"));");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_business_analytics_events_business_type_created\" ON public.business_analytics_events (\"BusinessId\", \"EventType\", \"CreatedAtUtc\");");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS public.business_analytics_events;");
        migrationBuilder.Sql("DROP TABLE IF EXISTS public.business_opportunities;");
        migrationBuilder.Sql("DROP TABLE IF EXISTS public.business_milestones;");
        migrationBuilder.Sql("DROP TABLE IF EXISTS public.business_reviews;");
    }
}
