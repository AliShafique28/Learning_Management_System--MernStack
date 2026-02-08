import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Clock } from 'lucide-react';
import ReactPlayer from 'react-player';
import { lessonAPI, moduleAPI, progressAPI, getFileURL } from '../../api/endpoints';
import { handleAPIError, showSuccess } from '../../utils/errorHandler';
import Loader from '../../components/common/Loader';
import { formatDuration } from '../../utils/formatters';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watched, setWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [id]);

  useEffect(() => {
    // Update progress every 5 seconds while playing
    const interval = setInterval(() => {
      if (playing && watched > 0) {
        updateVideoProgress();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [playing, watched]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);

      // Fetch lesson details
      const lessonRes = await lessonAPI.getById(id);
      const lessonData = lessonRes.data.data;
      setLesson(lessonData);

      // ✅ moduleId ko hamesha string banalo
      let moduleId;

      if (lessonData.module) {
        if (typeof lessonData.module === 'string') {
          moduleId = lessonData.module;
        } else if (typeof lessonData.module === 'object') {
          // Agar populated object mila ho
          moduleId = lessonData.module._id || lessonData.module.id;
        }
      }

      console.log('moduleId going to API:', moduleId);

      // Safety guard
      if (!moduleId) {
        throw new Error('Module ID not found on lesson');
      }

      // ✅ Ab yahan pe sirf string ID ja rahi hai
      const moduleLessons = await lessonAPI.getByModule(moduleId);
      const lessons = moduleLessons.data.data;
      setAllLessons(lessons);

      // Find current lesson index
      const index = lessons.findIndex((l) => l._id === id);
      setCurrentIndex(index);

      // Fetch video progress
      try {
        const progressRes = await progressAPI.getVideoProgress(id);
        const progressData = progressRes.data.data;
        setWatched(progressData.watchedDuration || 0);
        setIsCompleted(progressData.isCompleted || false);
      } catch (error) {
        // No progress yet
        setWatched(0);
        setIsCompleted(false);
      }
    } catch (error) {
      console.error('fetchLessonData error:', error);
      handleAPIError(error);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };


  const updateVideoProgress = async () => {
    try {
      await progressAPI.updateVideo({
        lessonId: id,
        watchedDuration: Math.floor(watched),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleProgress = (state) => {
    setProgress(state.played * 100);
    setWatched(state.playedSeconds);

    // Auto-complete if watched more than 90%
    if (state.played > 0.9 && !isCompleted) {
      markAsCompleted();
    }
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const markAsCompleted = async () => {
    try {
      await progressAPI.updateVideo({
        lessonId: id,
        watchedDuration: duration,
      });
      setIsCompleted(true);
      showSuccess('Lesson completed! 🎉');
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      navigate(`/student/lesson/${prevLesson._id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      navigate(`/student/lesson/${nextLesson._id}`);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Lesson not found</p>
      </div>
    );
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;
  const videoUrl = getFileURL(lesson.videoUrl);
  console.log('videoUrl => ', videoUrl); // Debug

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Video Player */}
      <div className="relative bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video">
            <video
              src={videoUrl}
              controls
              controlsList="nodownload"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                const played = e.target.duration ? (e.target.currentTime / e.target.duration) * 100 : 0;
                setProgress(played);
                setWatched(e.target.currentTime);

                // Auto-complete if watched more than 90%
                if (played > 90 && !isCompleted) {
                  markAsCompleted();
                }
              }}
              onDurationChange={(e) => {
                setDuration(e.target.duration);
              }}
              onEnded={() => {
                if (!isCompleted) markAsCompleted();
              }}
            />
          </div>
        </div>

        {/* Back Button Overlay */}
        <button
          onClick={() =>
            navigate(`/student/course/${typeof lesson.course === 'object' ? lesson.course._id : lesson.course}`)
          }
          className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Course
        </button>
      </div>

      {/* Lesson Info */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Title & Completion */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.description}</p>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-medium text-gray-900">
                {formatDuration(watched)} / {formatDuration(duration)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasPrevious
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Previous Lesson
            </button>

            {!isCompleted && progress > 90 && (
              <button
                onClick={markAsCompleted}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Complete
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasNext
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next Lesson
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Sidebar (Optional) */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h3 className="font-semibold text-gray-900 mb-4">All Lessons in this Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLessons.map((l, index) => (
              <button
                key={l._id}
                onClick={() => navigate(`/student/lesson/${l._id}`)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${l._id === id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDuration(l.videoDuration)}
                    </p>
                  </div>
                  {l._id === id && <CheckCircle className="w-5 h-5 text-primary-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
