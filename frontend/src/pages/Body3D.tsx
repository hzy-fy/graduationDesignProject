import React, { useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, Stage, Html, useProgress } from '@react-three/drei';
import { ArrowLeft, RotateCw, ZoomIn, ZoomOut, Layers, X, Info, Loader as LoaderIcon, MapPin, Activity, Zap, Move } from 'lucide-react';
import * as THREE from 'three';
import { acupointService, Acupoint } from '../services/acupoint';

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
    const texts: THREE.Object3D[] = [];
    const curves: THREE.Object3D[] = [];

    // 1. 遍历场景图：重命名特定对象 & 分类收集对象
    scene.traverse((child) => {
      // 重命名 Cube.001 为 印堂穴
      if (child.name === 'Cube.001' || child.name === 'Cube001') {
        child.name = '印堂穴';
      }

      if (child instanceof THREE.Mesh) {
        // 修复材质... (省略)
        if (child.name.includes('Eyes')) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.3,
            metalness: 0.1,
          });
          child.visible = true;
        } else if (child.name.includes('briefs')) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#444444', 
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
          });
          child.visible = true;
        }

        // 分类收集
        if (child.name.endsWith('穴')) {
          points.push(child);
        }
        else if (child.name.startsWith('Text') || child.name.startsWith('Text.')) {
          texts.push(child);
        }
        // 注意：Blender 导出的曲线可能不是 Mesh，可能是 Line 或其他 Object3D
        // 这里假设 curve 开头的对象需要处理
        else if (child.name.toLowerCase().startsWith('curve')) {
          curves.push(child);
        }
      } 
      // 有些 Curve 可能不是 Mesh 而是 Line
      else if (child instanceof THREE.Line && child.name.toLowerCase().startsWith('curve')) {
        curves.push(child);
      }
    });

    // 2. 建立组合关系 (Curve -> Acupoint & Text)
    // 算法：遍历所有 Curve，分别找到其起点和终点最近的 Acupoint 和 Text
    curves.forEach(curve => {
      // 获取 Curve 的世界坐标位置（通常是中心点）
      // 更精确的做法是获取 Geometry 的顶点，但这里先尝试用 position 和 bounding box
      // 由于 GLTF 加载后，几何体可能在本地坐标系，需要转换到世界坐标系比较
      
      // 简单起见，我们假设 Curve 的 geometry.boundingSphere.center 或者 position 可以代表其两端的大致区域
      // 但对于连接线，我们需要两个端点。
      
      let startPoint = new THREE.Vector3();
      let endPoint = new THREE.Vector3();

      if (curve instanceof THREE.Mesh || curve instanceof THREE.Line) {
        const geometry = (curve as any).geometry;
        if (geometry) {
           geometry.computeBoundingBox();
           // 获取包围盒的两个角作为近似端点 (这在直线情况下比较准确)
           // 注意：这只是一个近似，对于复杂曲线可能不准。
           // 更好的方法是读取 position attribute 的第一个和最后一个点
           if (geometry.attributes && geometry.attributes.position) {
             const pos = geometry.attributes.position;
             startPoint.fromBufferAttribute(pos, 0); // 第一个点
             endPoint.fromBufferAttribute(pos, pos.count - 1); // 最后一个点
           } else if (geometry.boundingBox) {
              startPoint.copy(geometry.boundingBox.min);
              endPoint.copy(geometry.boundingBox.max);
           }
           
           // 将本地坐标转换为世界坐标
           curve.updateMatrixWorld();
           startPoint.applyMatrix4(curve.matrixWorld);
           endPoint.applyMatrix4(curve.matrixWorld);
        }
      } else {
        // 如果没有 geometry，回退到对象位置 (虽然这通常不够)
        startPoint.copy(curve.position);
        endPoint.copy(curve.position);
      }

      // 寻找最近的“穴位”对象
      let nearestAcupoint: THREE.Object3D | null = null;
      let minDistAcupoint = Infinity;

      // 寻找最近的“文字”对象
      let nearestText: THREE.Object3D | null = null;
      let minDistText = Infinity;

      // 辅助函数：检查点到对象的距离
      const checkDistance = (point: THREE.Vector3, targets: THREE.Object3D[], type: 'acupoint' | 'text') => {
        let nearest: THREE.Object3D | null = null;
        let minDist = Infinity;
        
        targets.forEach(target => {
          const targetPos = new THREE.Vector3();
          target.getWorldPosition(targetPos);
          const dist = point.distanceTo(targetPos);
          if (dist < minDist) {
            minDist = dist;
            nearest = target;
          }
        });
        return { nearest, minDist };
      };

      // 检查 StartPoint 附近的穴位和文字
      const startAcupoint = checkDistance(startPoint, points, 'acupoint');
      const startText = checkDistance(startPoint, texts, 'text');

      // 检查 EndPoint 附近的穴位和文字
      const endAcupoint = checkDistance(endPoint, points, 'acupoint');
      const endText = checkDistance(endPoint, texts, 'text');

      // 组合逻辑：假设一端连穴位，一端连文字
      // 比较两端到穴位的最小距离
      if (startAcupoint.minDist < endAcupoint.minDist) {
        nearestAcupoint = startAcupoint.nearest;
        // 如果起点连了穴位，那终点应该连文字
        nearestText = endText.nearest;
      } else {
        nearestAcupoint = endAcupoint.nearest;
        nearestText = startText.nearest;
      }

      // 建立关联：将 Curve 和 Text 的 userData 指向 Acupoint
      if (nearestAcupoint) {
        // 在 Curve 上记录关联的穴位名
        curve.userData.linkedAcupoint = nearestAcupoint.name;
        
        // 在 Text 上记录关联的穴位名 (如果距离足够近，防止误判)
        // 这里的阈值可能需要根据模型实际尺寸调整
        if (nearestText) {
           nearestText.userData.linkedAcupoint = nearestAcupoint.name;
        }
        
        console.log(`Grouped: ${nearestAcupoint.name} <-> ${curve.name} <-> ${nearestText?.name || 'None'}`);
      }
    });

    // 3. 手动关联覆盖 (必须在自动关联之后执行，以覆盖自动判断的结果)
    // 印堂穴 (Cube.001) <-> curve013 <-> Text013
    const yintang = scene.getObjectByName('印堂穴');
    const curve013 = scene.getObjectByName('curve013');
    const text013 = scene.getObjectByName('Text013');
    
    if (yintang && curve013 && text013) {
      curve013.userData.linkedAcupoint = '印堂穴';
      text013.userData.linkedAcupoint = '印堂穴';
      console.log('Manually grouped (Override): 印堂穴 <-> curve013 <-> Text013');
    } else {
      console.log('Failed to manually group Yintang:', { yintang, curve013, text013 });
    }

    // 承泣穴 <-> curve017 <-> Text017
    const chengqi = scene.getObjectByName('承泣穴');
    const curve017 = scene.getObjectByName('curve017');
    const text017 = scene.getObjectByName('Text017');
    
    if (chengqi && curve017 && text017) {
      curve017.userData.linkedAcupoint = '承泣穴';
      text017.userData.linkedAcupoint = '承泣穴';
      console.log('Manually grouped (Override): 承泣穴 <-> curve017 <-> Text017');
    } else {
      console.log('Failed to manually group Chengqi:', { chengqi, curve017, text017 });
    }
    
    setAcupoints(points);
    console.log('Found acupoints:', points.map(p => p.name));
    
  }, [scene, scale]);

  // 处理模型点击事件
  const handleClick = (e: any) => {
    e.stopPropagation();
    // 打印点击对象的详细信息
    console.log('--- Clicked Object Details ---');
    console.log('Name:', e.object.name);
    console.log('Linked Acupoint:', e.object.userData.linkedAcupoint);
    
    let targetAcupointName = '';

    // 1. 直接点击穴位
    if (e.object.name.endsWith('穴')) {
      targetAcupointName = e.object.name;
    } 
    // 2. 点击了关联的对象 (Curve 或 Text)
    else if (e.object.userData.linkedAcupoint) {
      targetAcupointName = e.object.userData.linkedAcupoint;
      console.log('Resolved from group linkage:', targetAcupointName);
    }
    // 3. 回退逻辑：尝试名字包含
    else if (e.object.name.includes('穴')) {
       // ...之前的模糊匹配逻辑
       if (e.object.name.endsWith('穴')) targetAcupointName = e.object.name;
    }

    if (targetAcupointName) {
      onSelect(targetAcupointName);
    } else {
      console.log('Clicked non-acupoint object');
    }
  };

  return (
    <primitive 
      object={scene} 
      onClick={handleClick}
      onPointerOver={(e) => {
        // 仅当鼠标悬停在穴位或包含“穴”字的对象上时才显示手型光标
        const name = e.object.name || e.object.parent?.name || '';
        if (name.includes('穴')) {
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
  const [acupointInfo, setAcupointInfo] = useState<Acupoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMeridians, setShowMeridians] = useState(true);
  const [modelScale, setModelScale] = useState(0.2); // 初始缩放 0.2
  const [isPanMode, setIsPanMode] = useState(false); // 拖动移动模式状态

  useEffect(() => {
    if (selectedOrgan && selectedOrgan.endsWith('穴')) {
      const fetchAcupoint = async () => {
        setLoading(true);
        try {
          const data = await acupointService.getByName(selectedOrgan);
          setAcupointInfo(data);
        } catch (error) {
          console.error('Failed to fetch acupoint info:', error);
          setAcupointInfo(null);
        } finally {
          setLoading(false);
        }
      };
      fetchAcupoint();
    } else {
      setAcupointInfo(null);
    }
  }, [selectedOrgan]);

  // 缩放控制函数
  const handleZoomIn = () => {
    setModelScale(prev => Math.min(prev * 2, 1.6)); // 最大 0.2 * 8 = 1.6
  };

  const handleZoomOut = () => {
    setModelScale(prev => Math.max(prev / 2, 0.2)); // 最小 0.2
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">
      {/* 顶部导航与控制栏 - 限制在左侧 70% 区域，避免被右侧面板遮挡 */}
      <div className="absolute top-0 left-0 w-[70%] z-30 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white text-gray-800 rounded-full hover:bg-primary hover:text-white transition-colors shadow-md border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-gray-800 font-bold text-lg tracking-wider bg-white/80 px-3 py-1 rounded-lg backdrop-blur-sm shadow-sm">3D 人体经脉模型</h1>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <button className="p-2 bg-white text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-md border border-gray-200" title="复位">
            <RotateCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomIn}
            disabled={modelScale >= 1.6}
            className="p-2 bg-white text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="放大 (x2)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomOut}
            disabled={modelScale <= 0.2}
            className="p-2 bg-white text-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="缩小 (/2)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-2 rounded-lg transition-colors shadow-md border border-gray-200 ${isPanMode ? 'bg-primary text-white' : 'bg-white text-gray-800 hover:bg-primary hover:text-white'}`}
            title={isPanMode ? "切换为旋转模式" : "切换为平移模式"}
          >
            <Move className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMeridians(!showMeridians)}
            className={`p-2 rounded-lg transition-colors shadow-md border border-gray-200 ${showMeridians ? 'bg-primary text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
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
            mouseButtons={{
              LEFT: isPanMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
            touches={{
              ONE: isPanMode ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
          />
        </Canvas>

        {/* 底部操作提示 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/50 text-xs md:text-sm pointer-events-none bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
          点击穴位查看详情
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
                {acupointInfo ? (
                  <>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">基本信息</h3>
                      <div className="space-y-2">
                         <p className="text-gray-800 font-medium flex items-center gap-2">
                           <span className="w-2 h-2 bg-primary rounded-full"></span>
                           拼音：{acupointInfo.pinyin} ({acupointInfo.code})
                         </p>
                         <p className="text-gray-800 font-medium flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                           经络：{acupointInfo.meridian_name}
                         </p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">主治功效</h3>
                      <p className="text-gray-700 leading-relaxed text-sm mb-4">
                        {acupointInfo.cn_indication}
                      </p>
                      
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">定位</h3>
                      <p className="text-gray-700 leading-relaxed text-sm flex items-start gap-2">
                         <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                         {acupointInfo.cn_position}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">信息获取中</h3>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      正在查询穴位数据...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部：绿色背景 (40%) */}
            <div className="h-[40%] bg-gradient-to-br from-primary to-green-600 p-8 text-white overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-white/20 pb-2">
                <Activity className="w-5 h-5" />
                针灸与配伍
              </h3>

              {acupointInfo ? (
                <div className="space-y-4">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                    <h4 className="font-bold text-white/90 mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> 针灸法
                    </h4>
                    <p className="text-sm text-white/80 leading-relaxed mb-3">
                      {acupointInfo.cn_acupuncture}
                    </p>
                    
                    <h4 className="font-bold text-white/90 mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> 配伍
                    </h4>
                    <p className="text-sm text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: acupointInfo.cn_compatibility || '暂无配伍信息' }} />
                  </div>
                </div>
              ) : (
                 <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                    <p className="text-sm text-white/90 leading-relaxed">
                      暂无详细针灸数据
                    </p>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">未选择穴位</h3>
            <p className="text-sm">请点击左侧模型上的穴位<br />查看详细信息</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Body3D;