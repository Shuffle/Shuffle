from setuptools import setup, find_packages

setup(
    name='shuffle_sdk',  # Name of the package
    version='0.0.1',  # Version number
    description='The SDK used for Shuffle',  
    long_description=open('README.md').read(),  
    long_description_content_type='text/markdown',  
    author='Fredrik Saito Odegaardstuen',  
    author_email='frikky@shuffler.io',  
    url='https://github.com/shuffle/shuffle',  
    packages=find_packages(),  
    install_requires=[  
        'requests',
    ],
    classifiers=[  
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.7',  # Specify Python version requirements
)
