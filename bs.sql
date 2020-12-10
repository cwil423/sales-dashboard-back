CREATE TABLE forecasts (
  id SERIAL NOT NULL,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  forecast_date DATE NOT NULL,
  FOREIGN KEY (sale_id, product_id) REFERENCES sales_products (sales_id, product_id)
);

CREATE TABLE salespeople (
id SERIAL PRIMARY KEY,
first_name VARCHAR(255),
last_name VARCHAR(255)
);

INSERT INTO salespeople (
first_name,
last_name
)
VALUES ('Todd', 'Williamson');

CREATE TABLE customers (
id SERIAL PRIMARY KEY,
first_name VARCHAR(255) NOT NULL,
last_name VARCHAR(255) NOT NULL,
email VARCHAR(255)
);


CREATE TABLE sales (
id SERIAL PRIMARY KEY,
customer_id INT REFERENCES customers (id) NOT NULL,
salesperson_id INT REFERENCES salespeople (id) NOT NULL,
invoice_date DATE NOT NULL
);

INSERT INTO customers (first_name, last_name)
VALUES ('Robert', 'Williamson');

CREATE TABLE sales_products (
sales_id INT REFERENCES sales (id) NOT NULL,
product_id INT REFERENCES products (id) NOT NULL,
quantity INT NOT NULL,
price MONEY NOT NULL,
total MONEY NOT NULL,
frequency INT NOT NULL,
bulk BOOLEAN NOT NULL,
PRIMARY KEY (sales_id, product_id)
);

CREATE TABLE sales (
id SERIAL PRIMARY KEY,
customer_id INT REFERENCES customers (id) NOT NULL,
salesperson_id INT REFERENCES salespeople (id) NOT NULL,
invoice_date DATE NOT NULL
);

CREATE TABLE weighted_sales (
id SERIAL PRIMARY KEY,
sales_id INT REFERENCES sales (id) NOT NULL,
sale_date DATE NOT NULL,
weighted_amount MONEY NOT NULL
);

CREATE TABLE transactions (
id SERIAL PRIMARY KEY,
transaction_date DATE NOT NULL,
product VARCHAR(255) NOT NULL,
quantity INT NOT NULL,
price MONEY NOT NULL,
total MONEY NOT NULL,
customer VARCHAR(255) NOT NULL

);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  salesPerson BOOLEAN NOT NULL
);