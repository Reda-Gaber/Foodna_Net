CREATE DATABASE Foodna_Online ;
USE Foodna_Online ;

CREATE TABLE Employees 
(
Employee_ID INT AUTO_INCREMENT ,
Employee_Name VARCHAR(200) NOT NULL ,
Phone VARCHAR(20) NOT NULL ,
Email VARCHAR(200) NOT NULL ,
Role ENUM('Admin' , 'Cashire' , 'Chif') NOT NULL ,
Password VARCHAR(100) NOT NULL ,

CONSTRAINT Employees_pk PRIMARY KEY(Employee_ID) 
);

CREATE TABLE Customers 
(
Customer_ID INT AUTO_INCREMENT ,
Customer_Name VARCHAR(200) NOT NULL ,
Phone VARCHAR(20) NOT NULL ,
Email VARCHAR(200) NOT NULL ,
Password VARCHAR(100) NOT NULL ,

CONSTRAINT Customers_pk PRIMARY KEY(Customer_ID)
);

CREATE TABLE Inventory 
(
Inventory_ID INT AUTO_INCREMENT ,
Quantity_Available INT ,

CONSTRAINT Inventory_pk PRIMARY KEY(Inventory_ID) 
);

CREATE TABLE ShippingProviders
(
Shipping_ID INT AUTO_INCREMENT ,
Shipping_Name VARCHAR(200) NOT NULL ,
Phone VARCHAR(20) NOT NULL ,
Email VARCHAR(200) NOT NULL ,
-- Shipment_Number 

CONSTRAINT ShippingProviders_pk PRIMARY KEY(Shipping_ID)
);

CREATE TABLE Suppliers
(
Supplier_ID INT AUTO_INCREMENT ,
Supplier_Name VARCHAR(200) NOT NULL ,
Phone VARCHAR(20) NOT NULL ,
Email VARCHAR(200) NOT NULL ,
Employee_ID INT UNIQUE ,
CONSTRAINT Suppliers_pk PRIMARY KEY(Supplier_ID) ,
CONSTRAINT Employees_Supplier_fk FOREIGN KEY(Employee_ID) REFERENCES Employees(Employee_ID)
);

CREATE TABLE Products
(
Product_ID INT AUTO_INCREMENT ,
Product_Name VARCHAR(200) NOT NULL ,
Category varchar(200) not null ,
Descripion varchar(500) NOT NULL ,
Image TEXT ,
Quantity INT ,
Price DECIMAL(8,3) NOT NULL ,
Supplier_ID INT ,

CONSTRAINT Products_pk PRIMARY KEY(Product_ID) ,
CONSTRAINT Products_Supplier_fk FOREIGN KEY(Supplier_ID) REFERENCES Suppliers(Supplier_ID)
);

CREATE TABLE Carts
(
Cart_ID INT AUTO_INCREMENT ,
Quantity INT ,
Customer_ID INT  ,

CONSTRAINT Carts_pk PRIMARY KEY(Cart_ID) ,
CONSTRAINT Customer_Carts_fk FOREIGN KEY(Customer_ID) REFERENCES Customers(Customer_ID)
); 

CREATE TABLE Orders
(
Order_ID INT AUTO_INCREMENT ,
Order_Date DATE NOT NULL ,
Order_Time TIME NOT NULL ,
Customer_ID INT , 
Order_Status ENUM('Pending' , 'Shipped' , 'Delivered' , 'Cancelled') NOT NULL ,

CONSTRAINT Orders_pk PRIMARY KEY(Order_ID) ,
CONSTRAINT Orders_Customers_fk FOREIGN KEY(Customer_ID) REFERENCES Customers(Customer_ID)
);

CREATE TABLE Customer_Employees
(
Customer_ID INT ,
Employee_ID INT ,

CONSTRAINT Customer_Employees_pk PRIMARY KEY(Customer_ID , Employee_ID) ,
CONSTRAINT Customer_Employees_fk FOREIGN KEY(Customer_ID) REFERENCES Customers(Customer_ID) ,
CONSTRAINT Customer_Employee_fk FOREIGN KEY(Employee_ID) REFERENCES Employees(Employee_ID)
);

CREATE TABLE Product_Carts
(
Product_ID INT ,
Cart_ID INT ,

CONSTRAINT Product_Carts_pk PRIMARY KEY(Product_ID , Cart_ID) ,
CONSTRAINT Product_Cart_fk FOREIGN KEY(Product_ID) REFERENCES Products(Product_ID) ,
CONSTRAINT Product_Carts_fk FOREIGN KEY(Cart_ID) REFERENCES Carts(Cart_ID)
);

CREATE TABLE Products_Inventory 
(
Product_ID INT ,
Inventory_ID INT ,

CONSTRAINT Products_Inventory_pk PRIMARY KEY(Product_ID , Inventory_ID) ,
CONSTRAINT  Products_Inventory_fk FOREIGN KEY(Product_ID) REFERENCES Products(Product_ID) ,
CONSTRAINT  Product_Inventory_fk FOREIGN KEY(Inventory_ID) REFERENCES Inventory(Inventory_ID)
);

CREATE TABLE Inventory_Suppliers
(
Inventory_ID INT ,
Supplier_ID INT ,

CONSTRAINT Inventory_Suppliers_pk PRIMARY KEY(Inventory_ID , Supplier_ID) ,
CONSTRAINT Inventory_Suppliers_fk FOREIGN KEY(Inventory_ID) REFERENCES Inventory(Inventory_ID) ,
CONSTRAINT Inventory_Supplier_fk FOREIGN KEY(Supplier_ID) REFERENCES Suppliers(Supplier_ID)
);

CREATE TABLE Payment
(
Payment_ID INT AUTO_INCREMENT ,
Order_ID INT UNIQUE NOT NULL ,
Payment_Amount DECIMAL(8,3) NOT NULL ,
Payment_Date DATE NOT NULL ,
Payment_Method ENUM('Cash' , 'Credit Cart' , 'FawryPay') NOT NULL ,
Payment_Status ENUM('Completed' , ' Failed ' ) NOT NULL ,

CONSTRAINT Payment_pk PRIMARY KEY(Payment_ID) ,
CONSTRAINT Payment_Order_fk FOREIGN KEY(Order_ID) REFERENCES Orders(Order_ID)
);

CREATE TABLE Order_Shipping 
(
Order_ID INT  ,
Shipping_ID INT  ,

CONSTRAINT Order_Shipping_pk PRIMARY KEY(Order_ID , Shipping_ID) ,
CONSTRAINT Order_Shipping_fk FOREIGN KEY(Order_ID) REFERENCES Orders(Order_ID) , 
CONSTRAINT Orders_Shipping_fk FOREIGN KEY(Shipping_ID) REFERENCES ShippingProviders(Shipping_ID) 

);

CREATE TABLE Order_Products
(
Product_ID INT  ,
Order_ID INT   ,

CONSTRAINT Order_Products_pk PRIMARY KEY(Product_ID ,Order_ID) ,
CONSTRAINT Order_Products_fk FOREIGN KEY(Order_ID) REFERENCES Orders(Order_ID) ,
CONSTRAINT Order_Product_fk FOREIGN KEY(Product_ID) REFERENCES Products(Product_ID)
);