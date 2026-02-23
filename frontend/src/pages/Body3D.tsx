import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, Stage, Html, useProgress } from '@react-three/drei';
import { ArrowLeft, RotateCw, ZoomIn, ZoomOut, Layers, X, Info, Loader as LoaderIcon } from 'lucide-react';
import * as THREE from 'three';

// 加载进度指示器
const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-white bg-black/50 p-4 rounded-xl backdrop-blur-sm">
        <LoaderIcon className="w-8 h-8 animate-spin mb-2 text-primary" />
        <span className="text-sm font-medium">{progress.toFixed(0)}% 加载中...</span>
      </div>
    </Html>
  );
};

// GLTF 模型组件
const Model = ({ onSelect, scale }: { onSelect: (name: string) => void, scale: number }) => {
  const { scene } = useGLTF('/models/model.glb');
  const [acupoints, setAcupoints] = useState<THREE.Object3D[]>([]);
  console.log(scene.children);
  // 使用 useEffect 确保缩放正确应用，并筛选穴位
  useEffect(() => {
    scene.scale.set(scale, scale, scale);
    scene.position.set(0, -8, -5); // 稍微调整位置以居中
    
    const points: THREE.Object3D[] = [];
    
    // 遍历场景图寻找穴位，并处理特殊对象
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 修复眼睛材质 (Eyes) - 设置为白色光泽
        if (child.name.includes('Eyes')) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.3,
            metalness: 0.1,
          });
          child.visible = true; // 确保可见
        }
        
        // 修复短裤材质 (briefs) - 设置为深灰色哑光
        else if (child.name.includes('briefs')) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#444444', 
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide // 双面渲染防止背面剔除
          });
          child.visible = true;
        }

        // 收集穴位
        if (child.name.endsWith('穴')) {
          points.push(child);
        }
      }
    });
    
    setAcupoints(points);
    console.log('Found acupoints:', points.map(p => p.name));
    
  }, [scene, scale]);

  // 处理模型点击事件
  const handleClick = (e: any) => {
    e.stopPropagation();
    // 尝试获取点击对象的名称
    const objectName = e.object.name || e.object.parent?.name || '';
    
    // 仅当名称以 "穴" 结尾时才触发选择
    if (objectName.endsWith('穴')) {
      console.log('Clicked acupoint:', objectName);
      onSelect(objectName);
    } else {
      console.log('Clicked non-acupoint object:', objectName);
    }
  };

  return (
    <primitive 
      object={scene} 
      onClick={handleClick}
      onPointerOver={(e) => {
        // 仅当鼠标悬停在穴位上时才显示手型光标
        const name = e.object.name || e.object.parent?.name || '';
        if (name.endsWith('穴')) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    />
  );
};

// 预加载模型
useGLTF.preload('/models/model.glb');

const Body3D: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [showMeridians, setShowMeridians] = useState(true);
  const [modelScale, setModelScale] = useState(0.2); // 初始缩放 0.2

  // 缩放控制函数
  const handleZoomIn = () => {
    setModelScale(prev => Math.min(prev * 2, 1.6)); // 最大 0.2 * 8 = 1.6
  };

  const handleZoomOut = () => {
    setModelScale(prev => Math.max(prev / 2, 0.2)); // 最小 0.2
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">
      {/* 顶部导航与控制栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/50 text-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors backdrop-blur-sm border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-gray-800 font-bold text-lg tracking-wider">3D 人体经脉模型</h1>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <button className="p-2 bg-white/50 text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors backdrop-blur-sm border border-gray-200" title="复位">
            <RotateCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomIn}
            disabled={modelScale >= 1.6}
            className="p-2 bg-white/50 text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors backdrop-blur-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="放大 (x2)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomOut}
            disabled={modelScale <= 0.2}
            className="p-2 bg-white/50 text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors backdrop-blur-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="缩小 (/2)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMeridians(!showMeridians)}
            className={`p-2 rounded-lg transition-colors backdrop-blur-sm border border-gray-200 ${showMeridians ? 'bg-primary text-white' : 'bg-white/50 text-gray-400'}`}
            title="显示/隐藏经脉"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D 画布 (70%) */}
      <div className="absolute left-0 top-0 w-[70%] h-full">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={['#ffffff']} />

          <Suspense fallback={<Loader />}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <directionalLight position={[-10, 10, -5]} intensity={1.0} />
            <pointLight position={[0, 5, 0]} intensity={0.8} />
            <Model onSelect={setSelectedOrgan} scale={modelScale} />
          </Suspense>

          <OrbitControls
            enablePan={true}
            minDistance={1}
            maxDistance={20}
            zoomSpeed={2.0}
            makeDefault
          />
        </Canvas>

        {/* 底部操作提示 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/50 text-xs md:text-sm pointer-events-none bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
          单指旋转 · 双指缩放 · 点击器官查看详情
        </div>
      </div>

      {/* 右侧：相关说明 (30%) */}
      <div className="absolute right-0 top-0 w-[30%] h-full flex flex-col border-l border-gray-800 shadow-2xl z-20 bg-white">
        {selectedOrgan ? (
          <div className="flex flex-col h-full">
            {/* 头部：白色背景 (60%) */}
            <div className="h-[60%] bg-white p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{selectedOrgan}</h2>
                <button
                  onClick={() => setSelectedOrgan(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">经脉关联</h3>
                  <p className="text-gray-800 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    手少阴心经
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">体质影响</h3>
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-900">阳虚体质</span> 易出现心阳不足，表现为心悸、胸闷、畏寒。建议配合温补心阳的调理方案。
                  </p>
                </div>
              </div>
            </div>

            {/* 底部：绿色背景 (40%) */}
            <div className="h-[40%] bg-gradient-to-br from-primary to-green-600 p-8 text-white overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-white/20 pb-2">
                <Info className="w-5 h-5" />
                药物禁忌提示
              </h3>

              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                  <p className="text-sm text-white/90 leading-relaxed">
                    心脏病患者慎用含有麻黄碱的感冒药，可能引起心悸、心律失常。建议避免与强心苷类药物同时服用。
                  </p>
                </div>

                <button className="w-full py-3 bg-white text-primary rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg">
                  查看详细药典
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">未选择器官</h3>
            <p className="text-sm">请点击左侧模型上的器官<br />查看详细信息</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Body3D;