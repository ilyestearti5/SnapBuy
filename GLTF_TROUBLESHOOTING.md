# GLTF Loading Issues - Troubleshooting Guide

## Problem: "Loading 3D Model..." Stuck Forever

If your GLTF models are stuck in the loading state, here are the most common causes and solutions:

### 1. Check Three.js Installation

**Symptom**: Models never load, console shows Three.js import errors
**Solution**: Ensure Three.js is properly installed

```bash
# Install Three.js and types
npm install three @types/three

# Or if using yarn
yarn add three @types/three

# Or if using pnpm
pnpm add three @types/three
```

### 2. Use Diagnostic Tools

The implementation includes several debugging components to help identify issues:

#### A. ThreeJSDiagnostic Component

```tsx
import { ThreeJSDiagnostic } from "./components/ThreeJSDiagnostic";

// Use in your component
<ThreeJSDiagnostic />;
```

This will test if Three.js modules are loading correctly.

#### B. GLTFTester Component

```tsx
import { GLTFTester } from "./components/GLTFTester";

// Use in your component
<GLTFTester />;
```

This provides a testing interface with sample GLTF URLs and detailed logging.

### 3. Check Browser Console

The enhanced GLTFRenderer now provides detailed console logging:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with:
   - "MediaRenderer -"
   - "isGLTFFile"
   - "Attempting to load GLTF"
   - "GLTF loaded successfully" or error messages

### 4. Common Issues and Solutions

#### Issue: File Not Detected as GLTF

**Symptoms**:

- Console shows "Not a GLTF file"
- File displays as generic file icon instead of 3D viewer

**Solutions**:

- Ensure file has `.gltf` or `.glb` extension
- Check that uploaded file is actually a valid GLTF file
- For data URLs, verify the MIME type includes GLTF identifiers

#### Issue: CORS Policy Errors

**Symptoms**:

- Console shows "blocked by CORS policy"
- Network tab shows failed requests

**Solutions**:

- Use local files instead of external URLs
- Ensure server provides proper CORS headers
- For development, use a CORS proxy or disable CORS temporarily

#### Issue: Invalid GLTF Format

**Symptoms**:

- File loads but scene is empty
- Console shows "GLTF scene is empty or invalid"

**Solutions**:

- Verify GLTF file is valid using online validators
- Try different GLTF files to isolate the issue
- Use GLB format instead of GLTF for better compatibility

#### Issue: File Too Large

**Symptoms**:

- Loading timeout after 30 seconds
- Browser becomes unresponsive

**Solutions**:

- Reduce model complexity (polygon count)
- Compress textures
- Use Draco compression for GLTF files
- Convert large models to more efficient formats

### 5. Use Simple Renderer for Testing

If the main GLTFRenderer has issues, try the SimpleGLTFRenderer:

```tsx
import { SimpleGLTFRenderer } from "./components/SimpleGLTFRenderer";

// Replace GLTFRenderer temporarily
<SimpleGLTFRenderer src={yourGltfUrl} className="w-full h-64" />;
```

### 6. Test with Known Working Files

Use these test URLs to verify your setup:

```
https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf
```

### 7. Debug Information

The enhanced implementation provides extensive debug information:

#### MediaRenderer Debug Info:

- Shows detected file type
- Logs which renderer is being used

#### GLTFRenderer Debug Info:

- Three.js module loading status
- Model loading progress
- Scene validation
- Error details with specific causes

### 8. Fallback Strategy

If GLTF loading continues to fail, implement a fallback:

```tsx
const [useSimple, setUseSimple] = useState(false);

// In your component
{
  useSimple ? (
    <SimpleGLTFRenderer src={src} className={className} />
  ) : (
    <GLTFRenderer
      src={src}
      className={className}
      onError={() => setUseSimple(true)} // Switch to simple renderer on error
    />
  );
}
```

### 9. Performance Optimization

For better loading performance:

1. **Use GLB format** instead of GLTF (binary is faster)
2. **Optimize models** before uploading:
   - Reduce polygon count
   - Compress textures
   - Remove unnecessary materials
3. **Implement progressive loading** for large models
4. **Cache models** for repeated use

### 10. Verification Checklist

Before reporting issues, verify:

- [ ] Three.js is installed (`npm list three`)
- [ ] File has correct extension (`.gltf` or `.glb`)
- [ ] File is valid GLTF (test with online validator)
- [ ] Browser console shows detailed error messages
- [ ] Network tab shows successful file loading
- [ ] ThreeJSDiagnostic shows all green checkmarks
- [ ] Test files work with GLTFTester component

### 11. Getting Help

When reporting issues, include:

1. Browser console logs (full output)
2. Network tab screenshot showing file loading
3. ThreeJSDiagnostic results
4. Sample file that's not working
5. Browser and version information

This comprehensive debugging approach should help identify and resolve most GLTF loading issues.
