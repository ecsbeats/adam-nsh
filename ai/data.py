import os
import clickhouse_connect
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='.env')

def get_clickhouse_client():
    """
    Establishes a connection to the ClickHouse database using credentials
    from environment variables.

    Returns:
        clickhouse_connect.driver.client.Client: The ClickHouse client instance.
    """
    try:
        client = clickhouse_connect.get_client(
            host=os.getenv('CLICKHOUSE_URL', 'localhost').replace('http://', '').replace('https://', ''), # Remove protocol if present
            port=int(os.getenv('CLICKHOUSE_PORT', 8123)), # Default http port
            username=os.getenv('CLICKHOUSE_USER'),
            password=os.getenv('CLICKHOUSE_PASSWORD'),
            database=os.getenv('CLICKHOUSE_DATABASE')
        )
        client.ping() # Verify connection
        print("Successfully connected to ClickHouse.")
        return client
    except Exception as e:
        print(f"Error connecting to ClickHouse: {e}")
        raise # Re-raise the exception after printing

def load_data_by_geolocation(min_lat: float, max_lat: float, min_lon: float, max_lon: float, table: str = 'ais_data', client = None, limit: int = 10000) -> pd.DataFrame:
    """
    Loads data from a specified ClickHouse table within a given
    geographical bounding box.

    Args:
        min_lat: Minimum latitude.
        max_lat: Maximum latitude.
        min_lon: Minimum longitude.
        max_lon: Maximum longitude.
        table: The name of the table to query (defaults to 'ais_data').
        client: An existing ClickHouse client instance. If None, a new
                connection will be established.

    Returns:
        pd.DataFrame: A DataFrame containing the queried data.
    """
    if client is None:
        client = get_clickhouse_client()

    query = f"""
    SELECT *
    FROM {table}
    WHERE LAT >= %(min_lat)s AND LAT <= %(max_lat)s
      AND LON >= %(min_lon)s AND LON <= %(max_lon)s
      {f"LIMIT {limit}" if limit > 0 else ""}
    """
    params = {
        'min_lat': min_lat,
        'max_lat': max_lat,
        'min_lon': min_lon,
        'max_lon': max_lon
    }

    try:
        print(f"Querying data from {table} within bounding box: LAT({min_lat}, {max_lat}), LON({min_lon}, {max_lon})")
        df = client.query_df(query, parameters=params)
        print(f"Successfully loaded {len(df)} records.")
        return df
    except Exception as e:
        print(f"Error querying data: {e}")
        # Consider whether to return an empty DataFrame or raise the exception
        # For now, let's return an empty one
        return pd.DataFrame()

if __name__ == '__main__':
    # Define an example bounding box (e.g., around a specific area)
    # Adjust these values to a region where you expect data
    min_latitude = 34.4416
    max_latitude = 41.1082
    min_longitude = -126.6365
    max_longitude = -118.2023

    print("--- Testing ClickHouse Connection ---")
    try:
        # Optionally get a client explicitly first to test connection separately
        test_client = get_clickhouse_client()
        if test_client:
            print("\n--- Testing Geolocation Data Load ---")
            # Load data using the test client
            data_df = load_data_by_geolocation(
                min_latitude, max_latitude, min_longitude, max_longitude, client=test_client
            )

            if not data_df.empty:
                print("\nSample of loaded data:")
                print(data_df.head())
            else:
                print("\nNo data found for the specified location or an error occurred during query.")
        else:
             print("\nSkipping data load test due to connection failure.")
    except Exception as main_e:
        print(f"\nAn error occurred during the test run: {main_e}")
