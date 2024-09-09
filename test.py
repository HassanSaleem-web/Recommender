import pandas as pd

# Load the dataset and skip problematic lines
df = pd.read_csv(r'C:\Users\husse\Book Reccomendation\books.csv', on_bad_lines='skip')

# Print the number of rows loaded to ensure data is read correctly
print(f"Loaded dataset with {len(df)} rows.")

# Print the columns to see what features are available
print("Columns in the dataset:")
print(df.columns)
