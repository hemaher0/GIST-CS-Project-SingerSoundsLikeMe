from setuptools import setup, find_packages

setup(
    name="voice-separation",
    version="0.1.0",
    packages=find_packages(include=["vocal_separation", "vocal_separation.*"]),
    install_requires=[],
)
