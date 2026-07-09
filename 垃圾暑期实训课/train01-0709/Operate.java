/*定义公共接口 Operate */
public interface Operate {
    /*创建比赛对局，参数为两队ID和比赛结果，无返回值 */
    void createMatch(int teamAId, int teamBId, String result);
    /*按游戏分类统计积分，无参数无返回值 */
    void statScoreByGame();
    /*声明抽象方法：拉黑选手，参数为选手ID，无返回值 */
    void blacklistPlayer(int playerId);
}
