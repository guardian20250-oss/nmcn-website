-- CreateTable
CREATE TABLE "creator_stat_snapshots" (
    "id" SERIAL NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'weekly',
    "originalFilename" TEXT NOT NULL,
    "uploaderRole" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedOutOfScope" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_stat_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_stats" (
    "id" SERIAL NOT NULL,
    "snapshotId" INTEGER NOT NULL,
    "creatorAccountId" INTEGER,
    "exportedAt" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'weekly',
    "backstageCreatorId" VARCHAR(40) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "groupName" TEXT,
    "teamLead" TEXT,
    "graduationStatus" TEXT,
    "tierStatus" TEXT,
    "tierLastMonth" INTEGER,
    "relationshipStatus" TEXT,
    "subscriptionStatus" TEXT,
    "joinTime" TIMESTAMP(3),
    "daysSinceJoining" INTEGER,
    "invitationType" TEXT,
    "invitedBy" TEXT,
    "promotePermission" TEXT,
    "lastLive" TIMESTAMP(3),
    "notes" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "videos" INTEGER NOT NULL DEFAULT 0,
    "likes" BIGINT NOT NULL DEFAULT 0,
    "diamondsL30D" INTEGER NOT NULL DEFAULT 0,
    "validDaysL30D" INTEGER NOT NULL DEFAULT 0,
    "liveDurationL30D" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fanClubDiamondsL30D" INTEGER NOT NULL DEFAULT 0,
    "fanClubActiveFansL30D" INTEGER NOT NULL DEFAULT 0,
    "managementDates" TEXT,
    "renewedManagementDates" TEXT,
    "achievedStarCreator" BOOLEAN NOT NULL DEFAULT false,
    "starCreatorDaysThisMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_stat_audit_logs" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" INTEGER,
    "adminEmail" TEXT NOT NULL,
    "snapshotId" INTEGER,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_stat_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_stat_manager_assignments" (
    "id" SERIAL NOT NULL,
    "managerId" INTEGER NOT NULL,
    "teamLeadId" INTEGER,
    "backstageCreatorId" VARCHAR(40),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_stat_manager_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_stat_snapshots_exportedAt_idx" ON "creator_stat_snapshots"("exportedAt");

-- CreateIndex
CREATE INDEX "creator_stats_creatorAccountId_exportedAt_idx" ON "creator_stats"("creatorAccountId", "exportedAt");

-- CreateIndex
CREATE INDEX "creator_stats_snapshotId_idx" ON "creator_stats"("snapshotId");

-- CreateIndex
CREATE INDEX "creator_stats_username_idx" ON "creator_stats"("username");

-- CreateIndex
CREATE INDEX "creator_stats_teamLead_idx" ON "creator_stats"("teamLead");

-- CreateIndex
CREATE UNIQUE INDEX "creator_stats_backstageCreatorId_exportedAt_key" ON "creator_stats"("backstageCreatorId", "exportedAt");

-- CreateIndex
CREATE INDEX "creator_stat_audit_logs_createdAt_idx" ON "creator_stat_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "creator_stat_manager_assignments_managerId_idx" ON "creator_stat_manager_assignments"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_stat_manager_assignments_managerId_teamLeadId_key" ON "creator_stat_manager_assignments"("managerId", "teamLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_stat_manager_assignments_managerId_backstageCreator_key" ON "creator_stat_manager_assignments"("managerId", "backstageCreatorId");

-- AddForeignKey
ALTER TABLE "creator_stat_snapshots" ADD CONSTRAINT "creator_stat_snapshots_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_stats" ADD CONSTRAINT "creator_stats_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "creator_stat_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_stats" ADD CONSTRAINT "creator_stats_creatorAccountId_fkey" FOREIGN KEY ("creatorAccountId") REFERENCES "CreatorAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_stat_manager_assignments" ADD CONSTRAINT "creator_stat_manager_assignments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_stat_manager_assignments" ADD CONSTRAINT "creator_stat_manager_assignments_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable (Backstage email -> staff account mapping; additive)
CREATE TABLE "creator_stat_email_mappings" (
    "id" SERIAL NOT NULL,
    "backstageEmail" VARCHAR(254) NOT NULL,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_stat_email_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_stat_email_mappings_backstageEmail_key" ON "creator_stat_email_mappings"("backstageEmail");

-- CreateIndex
CREATE INDEX "creator_stat_email_mappings_adminId_idx" ON "creator_stat_email_mappings"("adminId");

-- AddForeignKey
ALTER TABLE "creator_stat_email_mappings" ADD CONSTRAINT "creator_stat_email_mappings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
