-- DropIndex
DROP INDEX `User_username_key` ON `user`;

-- AlterTable
ALTER TABLE `user` MODIFY `coins` INTEGER NOT NULL DEFAULT 0;
