import streamlit as st
from scrape import scrape_website
st.title("Scrap")

url = st.text_input("Enter Url: ")

if st.button("Scrape Site"):
    st.write("Scraping the website")
    result=scrape_website(url)
    print(result)