-- Petrol Pump POS System - PostgreSQL Schema
-- Complete database design for Pakistan petrol pump management

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('attendant', 'supervisor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel types configuration
CREATE TABLE fuel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    price_per_litre DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pumps configuration
CREATE TABLE pumps (
    id SERIAL PRIMARY KEY,
    pump_number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nozzles (each pump can have multiple nozzles for different fuel types)
CREATE TABLE nozzles (
    id SERIAL PRIMARY KEY,
    pump_id INTEGER REFERENCES pumps(id) ON DELETE CASCADE,
    nozzle_number VARCHAR(10) NOT NULL,
    fuel_type_id INTEGER REFERENCES fuel_types(id),
    UNIQUE(pump_id, nozzle_number),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tanks configuration
CREATE TABLE tanks (
    id SERIAL PRIMARY KEY,
    tank_number VARCHAR(10) NOT NULL UNIQUE,
    fuel_type_id INTEGER REFERENCES fuel_types(id),
    capacity_litres DECIMAL(10,2) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    reorder_level DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts management
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    shift_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    opening_cash DECIMAL(10,2) DEFAULT 0,
    closing_cash DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pump readings at shift start/end
CREATE TABLE pump_readings (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
    nozzle_id INTEGER REFERENCES nozzles(id),
    reading_type VARCHAR(10) NOT NULL CHECK (reading_type IN ('opening', 'closing')),
    meter_reading DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INTEGER REFERENCES users(id)
);

-- Sales transactions
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES shifts(id),
    nozzle_id INTEGER REFERENCES nozzles(id),
    opening_reading DECIMAL(10,2) NOT NULL,
    closing_reading DECIMAL(10,2) NOT NULL,
    litres_dispensed DECIMAL(10,2) GENERATED ALWAYS AS (closing_reading - opening_reading) STORED,
    price_per_litre DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS ((closing_reading - opening_reading) * price_per_litre) STORED,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'credit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Tank deliveries from suppliers
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id),
    challan_number VARCHAR(50) NOT NULL,
    litres_delivered DECIMAL(10,2) NOT NULL,
    delivery_date DATE NOT NULL,
    supplier_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Tank dip readings (manual stock verification)
CREATE TABLE tank_dips (
    id SERIAL PRIMARY KEY,
    tank_id INTEGER REFERENCES tanks(id),
    dip_reading DECIMAL(10,2) NOT NULL,
    temperature DECIMAL(5,2),
    recorded_date DATE NOT NULL,
    recorded_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment reconciliation
CREATE TABLE payment_reconciliation (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES shifts(id),
    payment_method VARCHAR(20) NOT NULL,
    expected_amount DECIMAL(10,2) NOT NULL,
    actual_amount DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_date ON shifts(shift_date);
CREATE INDEX idx_sales_shift_id ON sales(shift_id);
CREATE INDEX idx_pump_readings_shift_id ON pump_readings(shift_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Insert default fuel types
INSERT INTO fuel_types (name, code, price_per_litre) VALUES
('Petrol', 'PET', 280.50),
('Diesel', 'DSL', 275.75),
('Hi-Octane', 'HO', 320.00),
('Kerosene', 'KER', 265.25);

-- Insert sample pumps
INSERT INTO pumps (pump_number, name) VALUES
('P1', 'Pump 1'),
('P2', 'Pump 2'),
('P3', 'Pump 3'),
('P4', 'Pump 4');

-- Insert sample nozzles (each pump has 2 nozzles - petrol and diesel)
INSERT INTO nozzles (pump_id, nozzle_number, fuel_type_id) VALUES
(1, 'N1', 1), (1, 'N2', 2),
(2, 'N1', 1), (2, 'N2', 2),
(3, 'N1', 1), (3, 'N2', 3),
(4, 'N1', 1), (4, 'N2', 2);

-- Insert sample tanks
INSERT INTO tanks (tank_number, fuel_type_id, capacity_litres, current_stock, reorder_level) VALUES
('T1', 1, 10000, 8500, 2000),
('T2', 2, 8000, 6500, 1500),
('T3', 3, 5000, 4200, 1000);