import { MigrationInterface, QueryRunner } from 'typeorm';

export class MeetingSchemaFix1755250059503 implements MigrationInterface {
  name = 'MeetingSchemaFix1755250059503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP CONSTRAINT "FK_e149229c308db7a180840e501d8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "meeting_likes" ("id" character varying(26) NOT NULL, "meetingId" character varying(26) NOT NULL, "userId" character varying(26) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_17a188a3fea6be6569a886073ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8a30d9655c60f4bc05c6536f9c" ON "meeting_likes" ("meetingId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_transactions_type_enum" AS ENUM('meeting_payment', 'meeting_reward', 'meeting_refund', 'no_show_penalty', 'cancellation_penalty', 'host_early_cancel_penalty', 'system_adjustment')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."point_transactions_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "point_transactions" ("id" character varying(26) NOT NULL, "userId" character varying(26) NOT NULL, "meetingId" character varying(26), "type" "public"."point_transactions_type_enum" NOT NULL, "status" "public"."point_transactions_status_enum" NOT NULL DEFAULT 'pending', "amount" integer NOT NULL, "balanceBefore" integer NOT NULL, "balanceAfter" integer NOT NULL, "description" text, "metadata" json, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ceb5185b63f070e23d65509b0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meeting_attendances_status_enum" AS ENUM('checked_in', 'no_show', 'excused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meeting_attendances" ("id" character varying(26) NOT NULL, "meetingId" character varying(26) NOT NULL, "userId" character varying(26) NOT NULL, "status" "public"."meeting_attendances_status_enum", "checkedInAt" TIMESTAMP WITH TIME ZONE, "noShowMarkedAt" TIMESTAMP WITH TIME ZONE, "notes" text, "verification" json, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4645c9aeaf6e4d4de66a5b26325" UNIQUE ("meetingId", "userId"), CONSTRAINT "PK_810afa3eb7dcc5c384d1b45f89e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activity_logs_activitytype_enum" AS ENUM('meeting_joined', 'meeting_created', 'meeting_started', 'meeting_liked', 'photo_verification_submitted', 'photo_verification_approved', 'photo_verification_rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" character varying(26) NOT NULL, "userId" character varying(26) NOT NULL, "activityType" "public"."activity_logs_activitytype_enum" NOT NULL, "meetingId" character varying(26), "relatedUserId" character varying(26), "metadata" text, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4cd2e75dd6cb8242a45ddcc6f" ON "activity_logs" ("activityType", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_412f03f2a073c89f8918e6ae52" ON "activity_logs" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "districtVerifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "minParticipants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "maxParticipants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP COLUMN "note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD "latitude" numeric(10,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD "longitude" numeric(11,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastLocationVerificationAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "currentDistrictId" character varying(26)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "participants" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "hostStakePoints" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "participantStakePoints" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" ADD "pointsPaid" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" ADD "paidAmount" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" ADD "paymentTransactionId" character varying(26)`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" ADD "rewardReceived" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" ADD "rewardTransactionId" character varying(26)`,
    );
    await queryRunner.query(`ALTER TABLE "meetings" ADD "introduction" text`);
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "focusScore" integer NOT NULL DEFAULT '50'`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "likesCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "requiredPoints" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "rewardPoints" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "isPointsCollected" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "isRewardsDistributed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "cancelledAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "cancelledBy" character varying(26)`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "cancellationReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ADD "minimumParticipants" integer NOT NULL DEFAULT '2'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."missions_difficulty_enum" RENAME TO "missions_difficulty_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_difficulty_enum" AS ENUM('very_easy', 'easy', 'medium', 'hard', 'very_hard')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ALTER COLUMN "difficulty" TYPE "public"."missions_difficulty_enum" USING "difficulty"::"text"::"public"."missions_difficulty_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."missions_difficulty_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."meetings_status_enum" RENAME TO "meetings_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meetings_status_enum" AS ENUM('recruiting', 'ready', 'active', 'completed', 'canceled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" TYPE "public"."meetings_status_enum" USING "status"::"text"::"public"."meetings_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'recruiting'`,
    );
    await queryRunner.query(`DROP TYPE "public"."meetings_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "maxParticipants" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "maxParticipants" SET DEFAULT '4'`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP COLUMN "meetingId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD "meetingId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP COLUMN "hashtagId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD "hashtagId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a12418d4b633f6eb8cc1df53e58" FOREIGN KEY ("currentDistrictId") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_likes" ADD CONSTRAINT "FK_4f151672c280041db2c2db6f394" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_likes" ADD CONSTRAINT "FK_f7749b1d9dcdf31a7f36fa2e65f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_557e0c8c5a7a1a449723de76822" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" ADD CONSTRAINT "FK_5932024ce7567d5ff41b3e114d6" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_attendances" ADD CONSTRAINT "FK_34c4e48b5679fb4464daa2c606b" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_attendances" ADD CONSTRAINT "FK_5a32f6257ae0d760fc4ff173d3e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_597e6df96098895bf19d4b5ea45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_daddeef359f998cd67d53939a9f" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_18ca3297f9744262db73310177a" FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_18ca3297f9744262db73310177a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_daddeef359f998cd67d53939a9f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_597e6df96098895bf19d4b5ea45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_attendances" DROP CONSTRAINT "FK_5a32f6257ae0d760fc4ff173d3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_attendances" DROP CONSTRAINT "FK_34c4e48b5679fb4464daa2c606b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_5932024ce7567d5ff41b3e114d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "point_transactions" DROP CONSTRAINT "FK_557e0c8c5a7a1a449723de76822"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_likes" DROP CONSTRAINT "FK_f7749b1d9dcdf31a7f36fa2e65f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_likes" DROP CONSTRAINT "FK_4f151672c280041db2c2db6f394"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a12418d4b633f6eb8cc1df53e58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP COLUMN "hashtagId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD "hashtagId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" DROP COLUMN "meetingId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD "meetingId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "maxParticipants" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "maxParticipants" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meetings_status_enum_old" AS ENUM('recruiting', 'active', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" TYPE "public"."meetings_status_enum_old" USING "status"::"text"::"public"."meetings_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'recruiting'`,
    );
    await queryRunner.query(`DROP TYPE "public"."meetings_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."meetings_status_enum_old" RENAME TO "meetings_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."missions_difficulty_enum_old" AS ENUM('easy', 'medium', 'hard')`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ALTER COLUMN "difficulty" TYPE "public"."missions_difficulty_enum_old" USING "difficulty"::"text"::"public"."missions_difficulty_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."missions_difficulty_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."missions_difficulty_enum_old" RENAME TO "missions_difficulty_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "minimumParticipants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "cancellationReason"`,
    );
    await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "cancelledBy"`);
    await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "cancelledAt"`);
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "isRewardsDistributed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "isPointsCollected"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "rewardPoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "requiredPoints"`,
    );
    await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "likesCount"`);
    await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "focusScore"`);
    await queryRunner.query(
      `ALTER TABLE "meetings" DROP COLUMN "introduction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" DROP COLUMN "rewardTransactionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" DROP COLUMN "rewardReceived"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" DROP COLUMN "paymentTransactionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" DROP COLUMN "paidAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_participants" DROP COLUMN "pointsPaid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "participantStakePoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "hostStakePoints"`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" DROP COLUMN "participants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "currentDistrictId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "lastLocationVerificationAt"`,
    );
    await queryRunner.query(`ALTER TABLE "districts" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "districts" DROP COLUMN "latitude"`);
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD "note" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "maxParticipants" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "missions" ADD "minParticipants" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "districtVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_412f03f2a073c89f8918e6ae52"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4cd2e75dd6cb8242a45ddcc6f"`,
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."activity_logs_activitytype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "meeting_attendances"`);
    await queryRunner.query(
      `DROP TYPE "public"."meeting_attendances_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "point_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."point_transactions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."point_transactions_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a30d9655c60f4bc05c6536f9c"`,
    );
    await queryRunner.query(`DROP TABLE "meeting_likes"`);
    await queryRunner.query(
      `ALTER TABLE "meeting_profile_traits" ADD CONSTRAINT "FK_e149229c308db7a180840e501d8" FOREIGN KEY ("meetingId") REFERENCES "meeting_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
