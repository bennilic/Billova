import os
import importlib

modules = [f[:-3] for f in os.listdir(os.path.dirname(__file__)) if f.endswith('.py') and f != '__init__.py']
for module in modules:
    importlib.import_module(f'.{module}', package=__name__)