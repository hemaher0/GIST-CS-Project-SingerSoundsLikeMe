from setuptools import setup, find_packages

setup(
    name="voice-embedding",
    version="0.1.0",
    packages=find_packages(include=["vocal_embedding", "vocal_embedding.*"]),
    install_requires=[],
)
