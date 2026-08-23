import { Post, User } from '../types';

export const mockPosts: Post[] = [
  {
    id: 'post_pragya_1',
    userId: 'user_pragya',
    userName: 'Pragya',
    userRole: 'Master Practitioner • Super Diamond 💎✨ (36-Day Streak)',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya',
    content: 'Namaste community family! 🙏 Delighted to complete our 36th consecutive morning Pranayama & Meditation practice today. Consistency is the true essence of Yoga. Keep maintaining your streaks everyone! 🧘‍♀️✨ #YogaLife #SuperDiamond #PragyaConnect',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    timestamp: 'Just now',
    likes: 58,
    isLiked: true,
    comments: [
      {
        id: 'c_pragya_1',
        userId: 'user_akhilesh',
        userName: 'Dr. Akhilesh Sharma',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        content: 'Wonderful dedication Pragya! Your energy inspires the entire batch.',
        timestamp: '15 mins ago',
        likes: 12,
        isLiked: true,
      },
      {
        id: 'c_pragya_2',
        userId: 'user_priya',
        userName: 'Priya Sharma',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        content: 'Such a grounding session today! Loved the breathwork sequence.',
        timestamp: '10 mins ago',
        likes: 7,
        isLiked: false,
      }
    ],
    shares: 14,
  },
  {
    id: 'post_akhilesh_1',
    userId: 'user_akhilesh',
    userName: 'Dr. Akhilesh Sharma',
    userRole: 'Faculty Mentor • Ayurveda & Hatha Anatomy',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: 'Upcoming spine anatomy case studies have been updated in the Resources Library. Remember: Asana is not about forcing the pose, it is about aligning the spine with breath awareness.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop',
    timestamp: '3 hours ago',
    likes: 84,
    isLiked: false,
    comments: [
      {
        id: 'c_akh_1',
        userId: 'user_rahul',
        userName: 'Rahul Verma',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        content: 'Reviewing the spine diagrams now Dr. Akhilesh, extremely helpful!',
        timestamp: '2 hours ago',
        likes: 4,
        isLiked: true,
      },
    ],
    shares: 19,
  },
  {
    id: 'post_priya_1',
    userId: 'user_priya',
    userName: 'Priya Sharma',
    userRole: '200-Hr YTT Cohort • Diamond Member 💎 (18-Day Streak)',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    content: 'Completed day 18 of the alignment series! Practicing with props and straps has completely deepened my forward folds. Grateful for our mentor team. 🌿✨',
    timestamp: '6 hours ago',
    likes: 46,
    isLiked: true,
    comments: [
      {
        id: 'c_priya_1',
        userId: 'user_pragya',
        userName: 'Pragya',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya',
        content: 'Keep shining Priya! Beautiful progress on your posture.',
        timestamp: '5 hours ago',
        likes: 6,
        isLiked: true,
      },
    ],
    shares: 8,
  }
];

export const currentUser: User = {
  id: 'user_active',
  name: 'Pragya',
  role: 'Master Practitioner • Super Diamond 💎✨',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pragya'
};
