-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: foodna
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `Cart_ID` int NOT NULL AUTO_INCREMENT,
  `Quantity` int DEFAULT NULL,
  `Customer_ID` int DEFAULT NULL,
  PRIMARY KEY (`Cart_ID`),
  KEY `Customer_Carts_fk` (`Customer_ID`),
  CONSTRAINT `Customer_Carts_fk` FOREIGN KEY (`Customer_ID`) REFERENCES `customers` (`Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_employees`
--

DROP TABLE IF EXISTS `customer_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_employees` (
  `Customer_ID` int NOT NULL,
  `Employee_ID` int NOT NULL,
  PRIMARY KEY (`Customer_ID`,`Employee_ID`),
  KEY `Customer_Employee_fk` (`Employee_ID`),
  CONSTRAINT `Customer_Employee_fk` FOREIGN KEY (`Employee_ID`) REFERENCES `employees` (`Employee_ID`),
  CONSTRAINT `Customer_Employees_fk` FOREIGN KEY (`Customer_ID`) REFERENCES `customers` (`Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_employees`
--

LOCK TABLES `customer_employees` WRITE;
/*!40000 ALTER TABLE `customer_employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `Customer_ID` int NOT NULL AUTO_INCREMENT,
  `Customer_Name` varchar(200) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Email` varchar(200) NOT NULL,
  `Password` varchar(100) NOT NULL,
  PRIMARY KEY (`Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `Employee_ID` int NOT NULL AUTO_INCREMENT,
  `Employee_Name` varchar(200) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Email` varchar(200) NOT NULL,
  `Role` enum('Admin','Cashire','Chif') NOT NULL,
  `Password` varchar(100) NOT NULL,
  PRIMARY KEY (`Employee_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `Inventory_ID` int NOT NULL AUTO_INCREMENT,
  `Quantity_Available` int DEFAULT NULL,
  PRIMARY KEY (`Inventory_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_suppliers`
--

DROP TABLE IF EXISTS `inventory_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_suppliers` (
  `Inventory_ID` int NOT NULL,
  `Supplier_ID` int NOT NULL,
  PRIMARY KEY (`Inventory_ID`,`Supplier_ID`),
  KEY `Inventory_Supplier_fk` (`Supplier_ID`),
  CONSTRAINT `Inventory_Supplier_fk` FOREIGN KEY (`Supplier_ID`) REFERENCES `suppliers` (`Supplier_ID`),
  CONSTRAINT `Inventory_Suppliers_fk` FOREIGN KEY (`Inventory_ID`) REFERENCES `inventory` (`Inventory_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_suppliers`
--

LOCK TABLES `inventory_suppliers` WRITE;
/*!40000 ALTER TABLE `inventory_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_products`
--

DROP TABLE IF EXISTS `order_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_products` (
  `Product_ID` int NOT NULL,
  `Order_ID` int NOT NULL,
  PRIMARY KEY (`Product_ID`,`Order_ID`),
  KEY `Order_Products_fk` (`Order_ID`),
  CONSTRAINT `Order_Product_fk` FOREIGN KEY (`Product_ID`) REFERENCES `products` (`Product_ID`),
  CONSTRAINT `Order_Products_fk` FOREIGN KEY (`Order_ID`) REFERENCES `orders` (`Order_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_products`
--

LOCK TABLES `order_products` WRITE;
/*!40000 ALTER TABLE `order_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_shipping`
--

DROP TABLE IF EXISTS `order_shipping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_shipping` (
  `Order_ID` int NOT NULL,
  `Shipping_ID` int NOT NULL,
  PRIMARY KEY (`Order_ID`,`Shipping_ID`),
  KEY `Orders_Shipping_fk` (`Shipping_ID`),
  CONSTRAINT `Order_Shipping_fk` FOREIGN KEY (`Order_ID`) REFERENCES `orders` (`Order_ID`),
  CONSTRAINT `Orders_Shipping_fk` FOREIGN KEY (`Shipping_ID`) REFERENCES `shippingproviders` (`Shipping_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_shipping`
--

LOCK TABLES `order_shipping` WRITE;
/*!40000 ALTER TABLE `order_shipping` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_shipping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `Order_ID` int NOT NULL AUTO_INCREMENT,
  `Order_Date` date NOT NULL,
  `Order_Time` time NOT NULL,
  `Customer_ID` int DEFAULT NULL,
  `Order_Status` enum('Pending','Shipped','Delivered','Cancelled') NOT NULL,
  PRIMARY KEY (`Order_ID`),
  KEY `Orders_Customers_fk` (`Customer_ID`),
  CONSTRAINT `Orders_Customers_fk` FOREIGN KEY (`Customer_ID`) REFERENCES `customers` (`Customer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `Payment_ID` int NOT NULL AUTO_INCREMENT,
  `Order_ID` int NOT NULL,
  `Payment_Amount` decimal(8,3) NOT NULL,
  `Payment_Date` date NOT NULL,
  `Payment_Method` enum('Cash','Credit Cart','FawryPay') NOT NULL,
  `Payment_Status` enum('Completed',' Failed') NOT NULL,
  PRIMARY KEY (`Payment_ID`),
  UNIQUE KEY `Order_ID` (`Order_ID`),
  CONSTRAINT `Payment_Order_fk` FOREIGN KEY (`Order_ID`) REFERENCES `orders` (`Order_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_carts`
--

DROP TABLE IF EXISTS `product_carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_carts` (
  `Product_ID` int NOT NULL,
  `Cart_ID` int NOT NULL,
  PRIMARY KEY (`Product_ID`,`Cart_ID`),
  KEY `Product_Carts_fk` (`Cart_ID`),
  CONSTRAINT `Product_Cart_fk` FOREIGN KEY (`Product_ID`) REFERENCES `products` (`Product_ID`),
  CONSTRAINT `Product_Carts_fk` FOREIGN KEY (`Cart_ID`) REFERENCES `carts` (`Cart_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_carts`
--

LOCK TABLES `product_carts` WRITE;
/*!40000 ALTER TABLE `product_carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `Product_ID` int NOT NULL AUTO_INCREMENT,
  `Product_Name` varchar(200) NOT NULL,
  `Category` varchar(200) NOT NULL,
  `Descripion` varchar(500) NOT NULL,
  `Image` text,
  `Quantity` int DEFAULT NULL,
  `Price` decimal(8,3) NOT NULL,
  `Supplier_ID` int DEFAULT NULL,
  PRIMARY KEY (`Product_ID`),
  KEY `Products_Supplier_fk` (`Supplier_ID`),
  CONSTRAINT `Products_Supplier_fk` FOREIGN KEY (`Supplier_ID`) REFERENCES `suppliers` (`Supplier_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Alexandrian Liver Sandwich','Main Dish','A sandwich of seasoned Alexandrian liver with special spices, lemon sauce, and peppers. Fresh and hot.',NULL,NULL,30.000,NULL),(2,'Beef Burger Sandwich','Main Dish','Charcoal-grilled beef burger served in soft bread with cheese, lettuce, and tomato.',NULL,NULL,120.000,NULL),(3,'Chicken Burger Sandwich','Main Dish','Grilled and seasoned chicken burger served in soft bread with delicious sauce.',NULL,NULL,110.000,NULL),(4,'Syrian Beef Shawarma Sandwich','Main Dish','Syrian-style marinated beef shawarma, wrapped in fresh Syrian bread with special sauces.',NULL,NULL,90.000,NULL),(5,'Syrian Chicken Shawarma Sandwich','Main Dish','Marinated chicken pieces grilled on a skewer, served with toasted Syrian bread, pickles, and garlic sauce.',NULL,NULL,85.000,NULL),(6,'French Fries Sandwich','Main Dish','Crispy fried potatoes inside soft bread with pickles and garlic sauce.',NULL,NULL,20.000,NULL),(7,'Hot Dog Sandwich','Main Dish','Grilled hot dog in fresh baguette bread with ketchup and mayonnaise.',NULL,NULL,30.000,NULL),(8,'Sausage Sandwich','Main Dish','Local sausage cooked on a griddle with onion, pepper, and tomato, served in baguette bread.',NULL,NULL,50.000,NULL),(9,'Mixed Cheese Pizza','Pizza','A rich pizza topped with mozzarella, cheddar, roumy, and parmesan cheese.',NULL,NULL,130.000,NULL),(10,'Pepperoni Pizza','Pizza','Pizza topped with spicy pepperoni, tomato sauce, mozzarella cheese, and pepperoni slices.',NULL,NULL,135.000,NULL),(11,'Chicken Shawarma Pizza','Pizza','Pizza topped with chicken shawarma pieces, cheese sauce, onions, pickles, and peppers.',NULL,NULL,150.000,NULL),(12,'Margherita Pizza','Pizza','Pizza topped with tomato sauce and mozzarella cheese.',NULL,NULL,100.000,NULL),(13,'Chocolate Chip Cookies','Dessert','Freshly baked cookies with dark and milk chocolate chips.',NULL,NULL,20.000,NULL),(14,'Mini Chocolate Cheesecake','Dessert','Small-sized cheesecake topped with a rich chocolate layer.',NULL,NULL,25.000,NULL),(15,'Rice Pudding','Dessert','Creamy rice pudding made with fresh milk, topped with nuts and cinnamon.',NULL,NULL,35.000,NULL),(16,'Om Ali','Dessert','Traditional Egyptian dessert made with pastry, milk, nuts, and coconut.',NULL,NULL,40.000,NULL),(17,'Spiro Spats Cola','Beverage','Refreshing soft drink with cola flavor.',NULL,NULL,15.000,NULL),(18,'Spiro Spats Tangerine','Beverage','Soft drink with tangerine flavor.',NULL,NULL,15.000,NULL),(19,'Spiro Spats Lemon','Beverage','Soft drink with lemon flavor.',NULL,NULL,15.000,NULL),(20,'Fries Pack','Add-on','Golden crispy fries.',NULL,NULL,10.000,NULL),(21,'Garlic Sauce','Add-on','Creamy garlic dip.',NULL,NULL,20.000,NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products_inventory`
--

DROP TABLE IF EXISTS `products_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_inventory` (
  `Product_ID` int NOT NULL,
  `Inventory_ID` int NOT NULL,
  PRIMARY KEY (`Product_ID`,`Inventory_ID`),
  KEY `Product_Inventory_fk` (`Inventory_ID`),
  CONSTRAINT `Product_Inventory_fk` FOREIGN KEY (`Inventory_ID`) REFERENCES `inventory` (`Inventory_ID`),
  CONSTRAINT `Products_Inventory_fk` FOREIGN KEY (`Product_ID`) REFERENCES `products` (`Product_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_inventory`
--

LOCK TABLES `products_inventory` WRITE;
/*!40000 ALTER TABLE `products_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `products_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shippingproviders`
--

DROP TABLE IF EXISTS `shippingproviders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shippingproviders` (
  `Shipping_ID` int NOT NULL AUTO_INCREMENT,
  `Shipping_Name` varchar(200) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Email` varchar(200) NOT NULL,
  PRIMARY KEY (`Shipping_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shippingproviders`
--

LOCK TABLES `shippingproviders` WRITE;
/*!40000 ALTER TABLE `shippingproviders` DISABLE KEYS */;
/*!40000 ALTER TABLE `shippingproviders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `Supplier_ID` int NOT NULL AUTO_INCREMENT,
  `Supplier_Name` varchar(200) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Email` varchar(200) NOT NULL,
  `Employee_ID` int DEFAULT NULL,
  PRIMARY KEY (`Supplier_ID`),
  UNIQUE KEY `Employee_ID` (`Employee_ID`),
  CONSTRAINT `Employees_Supplier_fk` FOREIGN KEY (`Employee_ID`) REFERENCES `employees` (`Employee_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'foodna'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-12  6:10:30
