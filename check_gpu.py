import torch
import sys

print(f"Python version: {sys.version}")
print(f"PyTorch version: {torch.__version__}")

print("\n--- GPU Check ---")
if torch.cuda.is_available():
    print("✅ CUDA is available!")
    print(f"Device count: {torch.cuda.device_count()}")
    print(f"Current device: {torch.cuda.current_device()}")
    print(f"Device name: {torch.cuda.get_device_name(0)}")
    
    # 测试简单的张量运算
    try:
        x = torch.tensor([1.0, 2.0]).cuda()
        print("✅ Tensor successfully moved to GPU.")
    except Exception as e:
        print(f"❌ Error moving tensor to GPU: {e}")
else:
    print("❌ CUDA is NOT available.")
    print("This PyTorch installation is CPU-only.")
    print("Tip: If you have an NVIDIA GPU, please reinstall PyTorch with CUDA support.")
    print("Run: pip uninstall torch")
    print("Then visit https://pytorch.org/ to get the correct install command.")
