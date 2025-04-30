from setuptools import setup, Extension
from Cython.Build import cythonize
import os
import sys

# Define the extension module
extensions = [
    Extension(
        "src.security.hardware_id_cy",  # Name of the extension
        ["src/security/hardware_id.pyx"],  # Cython source file
        # Include directories if needed
        # include_dirs=[...],
        # Extra compile args if needed
        # extra_compile_args=[...],
    )
]

# Setup configuration
setup(
    name="BAR",
    ext_modules=cythonize(
        extensions,
        compiler_directives={
            "language_level": 3,
            # Add annotations for better type checking
            "annotation_typing": True,
            # Optimize
            "boundscheck": False,
            "wraparound": False,
            "initializedcheck": False,
        },
    ),
    # Ensure .pyx files are included in the package
    package_data={
        "src.security": ["*.pyx", "*.pxd"],
    },
    # Don't zip the package
    zip_safe=False,
)

# Function to build the extension in place
def build_ext_inplace():
    """Build the extension modules in-place for development."""
    from Cython.Build import build_ext
    from setuptools.command.build_ext import build_ext as _build_ext
    
    # Create a custom build_ext command
    class InplaceBuildExt(_build_ext):
        def finalize_options(self):
            _build_ext.finalize_options(self)
            self.inplace = 1
    
    # Run the build_ext command
    cmd = InplaceBuildExt(Distribution({"ext_modules": extensions}))
    cmd.ensure_finalized()
    cmd.run()

# If this script is run directly, build the extension in-place
if __name__ == "__main__":
    try:
        from setuptools.dist import Distribution
        build_ext_inplace()
        print("Successfully built Cython extension in-place.")
    except Exception as e:
        print(f"Error building Cython extension: {e}")
        sys.exit(1)