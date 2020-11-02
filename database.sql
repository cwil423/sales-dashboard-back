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

INSERT INTO sales (
  customer_first_name,
  customer_last_name
)
VALUES('Cole', 'Williamson');

INSERT INTO customers (first_name, last_name)
VALUES('Jim', 'Doe');

INSERT INTO products (product_name, price)
VALUES ('Special filter', 20.75);

ALTER TABLE sales
ADD COLUMN service_date DATE;

ALTER TABLE sales
ALTER COLUMN total_price TYPE money;

CREATE TABLE sales (
id SERIAL PRIMARY KEY,
customer_id INT REFERENCES customers (id) NOT NULL,
salesperson_id INT REFERENCES salespeople (id) NOT NULL,
product_id INT REFERENCES products (id) NOT NULL,
price INT NOT NULL,
quantity INT NOT NULL,
total_price INT NOT NULL,
service_date DATE NOT NULL
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
invoice_date DATE NOT NULL,
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
weighted_amount MONEY NOT NULL,
)