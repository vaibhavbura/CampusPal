import streamlit as st
st.title("Scrap")

url = st.text_input("Enter Url: ")

if st.button("Scrape Site"):
    st.write("Scraping the website")