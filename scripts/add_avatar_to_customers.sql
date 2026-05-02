-- Migration: add Avatar column to Customers table
ALTER TABLE Customers ADD COLUMN Avatar VARCHAR(255) NULL AFTER Address;
