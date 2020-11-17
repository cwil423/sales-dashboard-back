CREATE TABLE forecasts (
  id SERIAL NOT NULL,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  forecast_date DATE NOT NULL,
  FOREIGN KEY (sale_id, product_id) REFERENCES sales_products (sales_id, product_id)
);