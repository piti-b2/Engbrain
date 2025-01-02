-- Add clerkId column
ALTER TABLE public."User" ADD COLUMN "clerkId" TEXT;
ALTER TABLE public."User" ADD CONSTRAINT "User_clerkId_key" UNIQUE ("clerkId");
