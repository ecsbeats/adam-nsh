import pandas as pd
import clickhouse_connect
import os
from tqdm.auto import tqdm

# Load your CSV file (adjust the path as needed)
path = './AIS_2024_01_01.csv'

# --- Read CSV in Chunks --- 
chunk_size = 100000 

# 1. Read header to get and clean column names
header_df = pd.read_csv(path, nrows=0)
clean_columns = [col.strip() for col in header_df.columns]

# 2. Create chunk iterator, applying cleaned names
chunk_iter = pd.read_csv(path, chunksize=chunk_size, header=0, names=clean_columns)

# Connect to ClickHouse
client = clickhouse_connect.get_client(
    host='mamba.local',  # or your ClickHouse server
    username='admin',
    password=os.getenv('CLICKHOUSE_PASSWORD'),       # fill in if needed
    database='sample_data' # or your target database
)

# Create the table if it doesn't exist
client.command('''
CREATE TABLE IF NOT EXISTS ais_data (
    MMSI UInt32,
    BaseDateTime DateTime64(3, 'UTC'),
    LAT Float64,
    LON Float64,
    SOG Float32,
    COG Float32,
    Heading UInt16,
    VesselName String,
    IMO String,
    CallSign String,
    VesselType UInt16,
    Status UInt8,
    Length Float32,
    Width Float32,
    Draft Float32,
    Cargo Float32,
    TransceiverClass String
) ENGINE = MergeTree()
ORDER BY (BaseDateTime, MMSI)
''')

# -- Process and Insert Data in Chunks --
print(f"Starting data ingestion from {path} in chunks of {chunk_size}...")
chunk_count = 0
# Wrap chunk_iter with tqdm for progress bar
for chunk_df in tqdm(chunk_iter, desc="Ingesting CSV Chunks", unit="chunk"):
    chunk_count += 1
    # print(f"Processing chunk {chunk_count}...") # tqdm handles progress

    # Convert BaseDateTime to datetime if needed
    chunk_df['BaseDateTime'] = pd.to_datetime(chunk_df['BaseDateTime'])

    # Fill NaN in String columns to avoid TypeError during insertion
    string_columns = ['VesselName', 'IMO', 'CallSign', 'TransceiverClass']
    for col in string_columns:
        if col in chunk_df.columns:
            chunk_df[col] = chunk_df[col].fillna('').astype(str) # Ensure type is string after fillna

    # Insert the chunk DataFrame into ClickHouse
    # print(f"Inserting chunk {chunk_count} into ClickHouse...") # tqdm indicates activity
    client.insert_df('ais_data', chunk_df)
    # print(f"Chunk {chunk_count} inserted.") # tqdm handles progress

print("\nData ingestion complete.")
