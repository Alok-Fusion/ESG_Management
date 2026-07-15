-- CreateTable
CREATE TABLE "CarbonFootprintLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "commuteMode" TEXT NOT NULL,
    "commuteKm" REAL NOT NULL DEFAULT 0,
    "electricityKwh" REAL NOT NULL DEFAULT 0,
    "mealType" TEXT NOT NULL,
    "totalCO2Kg" REAL NOT NULL DEFAULT 0,
    "logDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarbonFootprintLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "reporterId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "resolution" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "IncidentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GreenCheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "xpEarned" INTEGER NOT NULL DEFAULT 5,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GreenCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SustainabilityPledge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "pledge" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SustainabilityPledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PledgeEndorsement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pledgeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PledgeEndorsement_pledgeId_fkey" FOREIGN KEY ("pledgeId") REFERENCES "SustainabilityPledge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PledgeEndorsement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SustainabilityTip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "GreenCheckIn_userId_checkDate_key" ON "GreenCheckIn"("userId", "checkDate");

-- CreateIndex
CREATE UNIQUE INDEX "PledgeEndorsement_pledgeId_userId_key" ON "PledgeEndorsement"("pledgeId", "userId");
